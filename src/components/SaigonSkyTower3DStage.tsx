import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Currency, Language, Residence, ThemeMode } from '../types/proptech';
import { formatCurrency } from '../engines/currencyEngine';
import {
  SKY_TOWER_TOTAL_STORIES,
  SKY_TOWER_UNITS,
  TOWER_FOOTPRINT_DEPTH,
  TOWER_FOOTPRINT_WIDTH,
  applyEscrowLockTransition,
  computeCameraPreset,
  computeMetroTrainState,
  computeSaigonSolarState,
  computeStoryElevationM,
  computeTowerTotalWorldY,
  computeUnitSolarMetrics,
  computeXRayFloorplateLayout,
  evaluateMetroViaductPoint,
  getEffectiveUnitStatus,
  getSkyTowerUnitByCode,
  getSkyTowerUnitByResidenceId,
  storyToWorldY,
  type EscrowLockRegistry,
  type EscrowLockTransitionResult,
  type SkyTowerCameraMode,
  type SkyTowerUnit,
  type SkyTowerUnitStatus,
} from '../engines/skyTower3dEngine';

export interface SaigonSkyTower3DStageProps {
  residences: Residence[];
  selectedResidence: Residence;
  onSelectResidence: (unit: Residence) => void;
  onOpenDeposit: (unit: Residence) => void;
  onBookViewing: (unit: Residence) => void;
  currency: Currency;
  lang: Language;
  theme: ThemeMode;
}

const STATUS_COLORS_3D: Record<SkyTowerUnitStatus, { hex: number; emissive: number }> = {
  Available: { hex: 0x10b981, emissive: 0x059669 },
  Reserved: { hex: 0xf59e0b, emissive: 0xd97706 },
  Sold: { hex: 0x64748b, emissive: 0x334155 },
};

const QUICK_UNIT_CODES = ['U-08A', 'U-12B', 'U-16A', 'U-20C', 'U-24PH', 'U-28SKY'] as const;

const SUN_PRESETS = [
  { hour: 6.0, labelEn: '06:00 Dawn', labelVi: '06:00 Bình Minh', id: 'dawn' },
  { hour: 12.5, labelEn: '12:30 Noon', labelVi: '12:30 Đỉnh Trưa', id: 'noon' },
  { hour: 17.5, labelEn: '17:30 Sunset', labelVi: '17:30 Hoàng Hôn', id: 'sunset' },
] as const;

function createFacadeTextures(): {
  diffuseTex: THREE.CanvasTexture;
  emissiveTex: THREE.CanvasTexture;
} {
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = 256;
  diffCanvas.height = 512;
  const dCtx = diffCanvas.getContext('2d');

  const emisCanvas = document.createElement('canvas');
  emisCanvas.width = 256;
  emisCanvas.height = 512;
  const eCtx = emisCanvas.getContext('2d');

  if (dCtx && eCtx) {
    // Low-E blue-bronze luxury glass base
    const grad = dCtx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#7294AE');
    grad.addColorStop(0.5, '#557996');
    grad.addColorStop(1, '#3D5D78');
    dCtx.fillStyle = grad;
    dCtx.fillRect(0, 0, 256, 512);

    eCtx.fillStyle = '#000000';
    eCtx.fillRect(0, 0, 256, 512);

    const rows = 28;
    const cols = 8;
    const rowH = 512 / rows;
    const colW = 256 / cols;

    for (let r = 0; r < rows; r += 1) {
      const y = r * rowH;
      // Spandrel horizontal band
      dCtx.fillStyle = 'rgba(22, 34, 54, 0.42)';
      dCtx.fillRect(0, y, 256, 3);

      for (let c = 0; c < cols; c += 1) {
        const x = c * colW;
        // Crisp champagne vertical mullion
        dCtx.fillStyle = 'rgba(210, 186, 138, 0.36)';
        dCtx.fillRect(x, y, 2, rowH);

        // Deterministic warm interior salon lights for golden hour / dusk glow
        const seed = (r * 37 + c * 19 + r * c * 7) % 13;
        if (seed < 7) {
          const lum = seed < 3 ? '#FFD99E' : '#F4BE76';
          eCtx.fillStyle = lum;
          eCtx.fillRect(x + 4, y + 4, colW - 7, rowH - 7);
        }
      }
    }
  }

  const diffuseTex = new THREE.CanvasTexture(diffCanvas);
  diffuseTex.wrapS = THREE.RepeatWrapping;
  diffuseTex.wrapT = THREE.ClampToEdgeWrapping;
  diffuseTex.colorSpace = THREE.SRGBColorSpace;

  const emissiveTex = new THREE.CanvasTexture(emisCanvas);
  emissiveTex.wrapS = THREE.RepeatWrapping;
  emissiveTex.wrapT = THREE.ClampToEdgeWrapping;
  emissiveTex.colorSpace = THREE.SRGBColorSpace;

  return { diffuseTex, emissiveTex };
}

function createWaterNormalTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const img = ctx.createImageData(size, size);
    const data = img.data;
    const twoPi = Math.PI * 2;
    for (let y = 0; y < size; y += 1) {
      const ny = (y / size) * twoPi;
      for (let x = 0; x < size; x += 1) {
        const nx = (x / size) * twoPi;
        const dx =
          Math.cos(nx * 3 + ny * 2) * 9 +
          Math.sin(nx * 6 - ny * 4) * 5 +
          Math.cos(ny * 8) * 4;
        const dy =
          Math.sin(ny * 4 + nx * 2) * 10 +
          Math.cos(ny * 7 - nx * 3) * 5;
        const idx = (y * size + x) * 4;
        data[idx] = Math.max(0, Math.min(255, Math.round(128 + dx)));
        data[idx + 1] = Math.max(0, Math.min(255, Math.round(128 + dy)));
        data[idx + 2] = 248;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(22, 18);
  return tex;
}

interface UnitMeshBundle {
  unitCode: string;
  facadeSide: SkyTowerUnit['facadeSide'];
  hitMesh: THREE.Mesh;
  rimMat: THREE.MeshStandardMaterial;
  bayMat: THREE.MeshStandardMaterial;
  glowHalo: THREE.Mesh;
  haloMat: THREE.MeshBasicMaterial;
}

export const SaigonSkyTower3DStage: React.FC<SaigonSkyTower3DStageProps> = ({
  residences,
  selectedResidence,
  onSelectResidence,
  onOpenDeposit,
  onBookViewing,
  currency,
  lang,
  theme,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  const initialUnit = useMemo(
    () => getSkyTowerUnitByResidenceId(selectedResidence.id) ?? SKY_TOWER_UNITS[9], // U-24PH default
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [selectedUnitCode, setSelectedUnitCode] = useState<string>(initialUnit.unitCode);
  const [hoveredUnitCode, setHoveredUnitCode] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<SkyTowerCameraMode>('ORBIT');
  const [solarHour, setSolarHour] = useState<number>(10.25);
  const [isSunPlaying, setIsSunPlaying] = useState<boolean>(false);
  const [escrowRegistry, setEscrowRegistry] = useState<EscrowLockRegistry>({});
  const [lastLockResult, setLastLockResult] = useState<EscrowLockTransitionResult | null>(null);
  const [lockAttemptCount, setLockAttemptCount] = useState<number>(0);
  const [metroHudInfo, setMetroHudInfo] = useState<{ speedKmh: number; station: string }>({
    speedKmh: 72,
    station: 'Thao Dien · An Phu',
  });

  // Sync downward when user clicks a different unit in the lower 2D explorer
  useEffect(() => {
    const mapped = getSkyTowerUnitByResidenceId(selectedResidence.id);
    if (mapped && mapped.unitCode !== selectedUnitCode) {
      setSelectedUnitCode(mapped.unitCode);
      setLastLockResult(null);
    }
  }, [selectedResidence.id, selectedUnitCode]);

  const selectedUnit = useMemo(
    () => getSkyTowerUnitByCode(selectedUnitCode) ?? SKY_TOWER_UNITS[9],
    [selectedUnitCode]
  );

  const mappedResidence = useMemo(
    () => residences.find((r) => r.id === selectedUnit.residenceId) ?? selectedResidence,
    [residences, selectedUnit.residenceId, selectedResidence]
  );

  const solarState = useMemo(() => computeSaigonSolarState(solarHour), [solarHour]);
  const unitSolar = useMemo(
    () => computeUnitSolarMetrics(selectedUnit, solarState),
    [selectedUnit, solarState]
  );
  const xrayLayout = useMemo(() => computeXRayFloorplateLayout(selectedUnit), [selectedUnit]);
  const effectiveStatus = getEffectiveUnitStatus(selectedUnit, escrowRegistry);

  // Refs synced to 60fps Three.js loop without recreating WebGL context
  const stateRef = useRef({
    selectedUnit,
    hoveredUnitCode,
    cameraMode,
    solarHour,
    isSunPlaying,
    escrowRegistry,
    orbitAzimuthRad: 0.42, // SSE luxury perspective showing Full 28-Story Tower + River + Metro + Ba Son Bridge
    orbitElevationRad: 0.29,
    orbitDistance: 41.5,
    povYawOffsetRad: 0,
    povPitchOffsetRad: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragMovedPx: 0,
  });

  useEffect(() => {
    stateRef.current.selectedUnit = selectedUnit;
  }, [selectedUnit]);

  useEffect(() => {
    stateRef.current.hoveredUnitCode = hoveredUnitCode;
  }, [hoveredUnitCode]);

  useEffect(() => {
    stateRef.current.cameraMode = cameraMode;
    if (cameraMode === 'BALCONY_POV') {
      stateRef.current.povYawOffsetRad = 0;
      stateRef.current.povPitchOffsetRad = 0;
    } else if (cameraMode === 'XRAY') {
      stateRef.current.orbitAzimuthRad = 0.62;
      stateRef.current.orbitElevationRad = 0.46;
    }
  }, [cameraMode]);

  useEffect(() => {
    stateRef.current.solarHour = solarHour;
  }, [solarHour]);

  useEffect(() => {
    stateRef.current.isSunPlaying = isSunPlaying;
  }, [isSunPlaying]);

  useEffect(() => {
    stateRef.current.escrowRegistry = escrowRegistry;
  }, [escrowRegistry]);

  const handleSelectUnitByCode = useCallback(
    (unitCode: string) => {
      const unit = getSkyTowerUnitByCode(unitCode);
      if (!unit) return;
      setSelectedUnitCode(unit.unitCode);
      setLastLockResult(null);
      const res = residences.find((r) => r.id === unit.residenceId);
      if (res) {
        onSelectResidence(res);
      }
      // Gently swing orbit azimuth toward the clicked facade if in ORBIT mode
      if (stateRef.current.cameraMode === 'ORBIT') {
        if (unit.facadeSide === 'SE_RIVER') stateRef.current.orbitAzimuthRad = 0.52;
        else if (unit.facadeSide === 'SW_SUNSET') stateRef.current.orbitAzimuthRad = -0.58;
        else stateRef.current.orbitAzimuthRad = 1.95;
      }
    },
    [residences, onSelectResidence]
  );

  const handleLockEscrow = useCallback(() => {
    const nextAttempt = lockAttemptCount + 1;
    setLockAttemptCount(nextAttempt);
    // First lock creates a fresh idempotency key; subsequent clicks simulate a contending buyer triggering HTTP 409!
    const key = `kinetix-web-${selectedUnit.unitCode}-buyer-${nextAttempt}`;
    const result = applyEscrowLockTransition(
      escrowRegistry,
      selectedUnit.unitCode,
      key,
      new Date().toISOString()
    );
    setEscrowRegistry(result.nextRegistry);
    setLastLockResult(result);
  }, [escrowRegistry, lockAttemptCount, selectedUnit.unitCode]);

  const handleZoomDelta = useCallback((delta: number) => {
    stateRef.current.orbitDistance = Math.min(50, Math.max(22, stateRef.current.orbitDistance + delta));
  }, []);

  const handleResetView = useCallback(() => {
    setCameraMode('ORBIT');
    stateRef.current.orbitAzimuthRad = 0.42;
    stateRef.current.orbitElevationRad = 0.29;
    stateRef.current.orbitDistance = 41.5;
    stateRef.current.povYawOffsetRad = 0;
    stateRef.current.povPitchOffsetRad = 0;
  }, []);

  // Diurnal sun playback ticker
  useEffect(() => {
    if (!isSunPlaying) return;
    const id = window.setInterval(() => {
      setSolarHour((prev) => {
        const next = prev + 0.1;
        return next > 18.5 ? 6.0 : Number(next.toFixed(2));
      });
    }, 90);
    return () => window.clearInterval(id);
  }, [isSunPlaying]);

  // Keyboard shortcuts when stage is focused
  const handleStageKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === '1') setCameraMode('ORBIT');
    else if (e.key === '2') setCameraMode('BALCONY_POV');
    else if (e.key === '3') setCameraMode('XRAY');
    else if (e.key === 'ArrowRight') setSolarHour((h) => Math.min(18.5, Number((h + 0.5).toFixed(2))));
    else if (e.key === 'ArrowLeft') setSolarHour((h) => Math.max(6.0, Number((h - 0.5).toFixed(2))));
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = SKY_TOWER_UNITS.findIndex((u) => u.unitCode === selectedUnit.unitCode);
      const nextIdx =
        e.key === 'ArrowUp'
          ? (idx + 1) % SKY_TOWER_UNITS.length
          : (idx - 1 + SKY_TOWER_UNITS.length) % SKY_TOWER_UNITS.length;
      handleSelectUnitByCode(SKY_TOWER_UNITS[nextIdx].unitCode);
    }
  };

  // Main 60fps Three.js PBR Scene Lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
      });
      if (!renderer.getContext()) {
        setWebglFailed(true);
        return;
      }
    } catch {
      setWebglFailed(true);
      return;
    }

    const initW = Math.max(320, container.clientWidth);
    const initH = Math.max(320, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(initW, initH);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.setAttribute('aria-label', '3D Saigon Sky-Tower Interactive Canvas');
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const initialSolar = computeSaigonSolarState(stateRef.current.solarHour);
    scene.background = new THREE.Color(initialSolar.skyHorizonColorHex);
    scene.fog = new THREE.FogExp2(initialSolar.fogColorHex, 0.0068);

    const camera = new THREE.PerspectiveCamera(42, initW / initH, 0.15, 280);
    const initCam = computeCameraPreset(
      stateRef.current.cameraMode,
      stateRef.current.selectedUnit,
      stateRef.current.orbitAzimuthRad,
      stateRef.current.orbitElevationRad,
      stateRef.current.orbitDistance
    );
    camera.position.set(initCam.position.x, initCam.position.y, initCam.position.z);
    const currentLookTarget = new THREE.Vector3(initCam.target.x, initCam.target.y, initCam.target.z);
    camera.lookAt(currentLookTarget);

    // =========================================================================
    // 1. PROCEDURAL GRADIENT SKY DOME + MOVING SAIGON SOLAR DISC
    // =========================================================================
    const skyGeo = new THREE.SphereGeometry(145, 32, 20);
    const skyPos = skyGeo.attributes.position;
    const skyColors = new Float32Array(skyPos.count * 3);
    skyGeo.setAttribute('color', new THREE.BufferAttribute(skyColors, 3));
    const skyMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    });
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyDome);

    const updateSkyDomeColors = (topHex: string, horizonHex: string) => {
      const topC = new THREE.Color(topHex);
      const horC = new THREE.Color(horizonHex);
      const groundC = new THREE.Color(horizonHex).lerp(new THREE.Color('#2B3A4E'), 0.22);
      const tmp = new THREE.Color();
      const arr = skyGeo.attributes.color.array as Float32Array;
      for (let i = 0; i < skyPos.count; i += 1) {
        const ny = skyPos.getY(i) / 145;
        if (ny >= 0) {
          const factor = Math.pow(ny, 0.58);
          tmp.copy(horC).lerp(topC, factor);
        } else {
          tmp.copy(horC).lerp(groundC, Math.min(1, -ny * 2.5));
        }
        arr[i * 3] = tmp.r;
        arr[i * 3 + 1] = tmp.g;
        arr[i * 3 + 2] = tmp.b;
      }
      skyGeo.attributes.color.needsUpdate = true;
    };
    updateSkyDomeColors(initialSolar.skyTopColorHex, initialSolar.skyHorizonColorHex);

    const sunDiscMat = new THREE.MeshBasicMaterial({ color: initialSolar.sunColorHex, fog: false });
    const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(2.6, 20, 16), sunDiscMat);
    scene.add(sunDisc);

    const sunHaloMat = new THREE.MeshBasicMaterial({
      color: initialSolar.sunColorHex,
      transparent: true,
      opacity: 0.24,
      fog: false,
    });
    const sunHalo = new THREE.Mesh(new THREE.SphereGeometry(5.2, 20, 16), sunHaloMat);
    scene.add(sunHalo);

    // =========================================================================
    // 2. LIGHTING RIG WITH REAL-TIME PCFSoftShadowMap DIRECTIONAL SUN
    // =========================================================================
    const hemiLight = new THREE.HemisphereLight(
      initialSolar.skyTopColorHex,
      '#CBBFA8',
      initialSolar.ambientIntensity
    );
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(initialSolar.sunColorHex, initialSolar.sunIntensity);
    sunLight.position.set(
      initialSolar.sunPosition.x,
      initialSolar.sunPosition.y,
      initialSolar.sunPosition.z
    );
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 6;
    sunLight.shadow.camera.far = 145;
    sunLight.shadow.camera.left = -36;
    sunLight.shadow.camera.right = 36;
    sunLight.shadow.camera.top = 34;
    sunLight.shadow.camera.bottom = -22;
    sunLight.shadow.bias = -0.00045;
    sunLight.shadow.normalBias = 0.04;
    scene.add(sunLight);

    // Subtle warm fill light from river reflection bounce
    const bounceLight = new THREE.DirectionalLight('#D9E7F2', 0.42);
    bounceLight.position.set(-18, 10, 26);
    scene.add(bounceLight);

    // =========================================================================
    // 3. THU THIEM PENINSULA ISLAND, BOTANICAL PARKWAY & EXPANSIVE SAIGON RIVER
    // =========================================================================
    // Vast reflective Saigon River wrapping around the Thu Thiem Peninsula bend
    const waterNormalTex = createWaterNormalTexture();
    const riverMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialSolar.riverTintHex),
      roughness: 0.14,
      metalness: 0.46,
      normalMap: waterNormalTex,
      normalScale: new THREE.Vector2(0.18, 0.18),
    });
    const riverMesh = new THREE.Mesh(new THREE.PlaneGeometry(280, 260), riverMat);
    riverMesh.rotation.x = -Math.PI / 2;
    riverMesh.position.set(0, -0.22, 6);
    riverMesh.receiveShadow = true;
    scene.add(riverMesh);

    // Sculpted Thu Thiem Riverfront Peninsula parcel (clean island surrounded by Saigon River!)
    const landMat = new THREE.MeshStandardMaterial({
      color: 0xe6ded0,
      roughness: 0.82,
      metalness: 0.04,
    });
    const peninsulaBase = new THREE.Mesh(new THREE.BoxGeometry(36, 1.35, 20.5), landMat);
    peninsulaBase.position.set(-0.5, -0.68, -2.8);
    peninsulaBase.receiveShadow = true;
    scene.add(peninsulaBase);

    // Lush emerald Thu Thiem Riverfront Parkland lawns framing the architectural podium
    const parkGrassMat = new THREE.MeshStandardMaterial({
      color: 0x4d7c5c,
      roughness: 0.88,
      metalness: 0.02,
    });
    const westPark = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.16, 16.5), parkGrassMat);
    westPark.position.set(-12.2, 0.04, -2.0);
    westPark.receiveShadow = true;
    const eastPark = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.16, 16.5), parkGrassMat);
    eastPark.position.set(11.6, 0.04, -2.0);
    eastPark.receiveShadow = true;
    scene.add(westPark, eastPark);

    // Riverfront granite quay promenade wall along South & East edges of the peninsula
    const quayMat = new THREE.MeshStandardMaterial({
      color: 0xd6cbb8,
      roughness: 0.62,
      metalness: 0.08,
    });
    const quaySouth = new THREE.Mesh(new THREE.BoxGeometry(37.2, 0.56, 2.0), quayMat);
    quaySouth.position.set(-0.5, 0.08, 7.1);
    quaySouth.receiveShadow = true;
    quaySouth.castShadow = true;
    const quayEast = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.56, 21.5), quayMat);
    quayEast.position.set(17.5, 0.08, -2.8);
    quayEast.receiveShadow = true;
    scene.add(quaySouth, quayEast);

    // Distant District 1 & Binh Thanh opposite river bank across the Saigon River channel
    const farBankMat = new THREE.MeshStandardMaterial({
      color: 0xc9c5bc,
      roughness: 0.88,
      metalness: 0.04,
    });
    const farBank = new THREE.Mesh(new THREE.BoxGeometry(140, 1.1, 46), farBankMat);
    farBank.position.set(0, -0.58, -44);
    farBank.receiveShadow = true;
    scene.add(farBank);

    // =========================================================================
    // 4. LANDSCAPED PODIUM, REFLECTION POOL & TROPICAL TREES
    // =========================================================================
    const travertineMat = new THREE.MeshStandardMaterial({
      color: 0xf1ebe0,
      roughness: 0.54,
      metalness: 0.06,
    });
    const warmStoneMat = new THREE.MeshStandardMaterial({
      color: 0xe2d7c5,
      roughness: 0.62,
      metalness: 0.05,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xb8924a,
      roughness: 0.28,
      metalness: 0.78,
    });

    // Stepped luxury podium
    const podiumBase = new THREE.Mesh(new THREE.BoxGeometry(12.6, 1.35, 9.8), warmStoneMat);
    podiumBase.position.set(0, 0.675, 0.3);
    podiumBase.castShadow = true;
    podiumBase.receiveShadow = true;
    scene.add(podiumBase);

    const podiumUpper = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.9, 7.2), travertineMat);
    podiumUpper.position.set(0, 1.78, 0);
    podiumUpper.castShadow = true;
    podiumUpper.receiveShadow = true;
    scene.add(podiumUpper);

    // Glowing double-height glass lobby atrium
    const lobbyMat = new THREE.MeshStandardMaterial({
      color: 0xffe4b5,
      emissive: 0xd99b44,
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.25,
    });
    const lobbyGlass = new THREE.Mesh(new THREE.BoxGeometry(6.8, 1.55, 5.2), lobbyMat);
    lobbyGlass.position.set(0, 1.15, 0.45);
    scene.add(lobbyGlass);

    // Cantilevered brass porte-cochere canopy
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.16, 2.5), brassMat);
    canopy.position.set(0, 1.88, 4.1);
    canopy.castShadow = true;
    scene.add(canopy);

    // Waterfront emerald reflection pool on podium terrace
    const poolMat = new THREE.MeshStandardMaterial({
      color: 0x1d7082,
      roughness: 0.1,
      metalness: 0.38,
    });
    const reflectionPool = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.08, 1.9), poolMat);
    reflectionPool.position.set(0, 0.14, 5.5);
    reflectionPool.receiveShadow = true;
    scene.add(reflectionPool);

    // Sculptural tropical palm/canopy trees along Thu Thiem boulevard & quay
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6e5a47, roughness: 0.9 });
    const foliageMatA = new THREE.MeshStandardMaterial({ color: 0x2f684c, roughness: 0.78 });
    const foliageMatB = new THREE.MeshStandardMaterial({ color: 0x417f5e, roughness: 0.74 });
    const treeCoords: Array<[number, number, number]> = [
      [-8.5, 0, 5.2],
      [-6.8, 0, 5.8],
      [7.4, 0, 5.3],
      [9.4, 0, 5.7],
      [-11.2, 0, 1.8],
      [-9.4, 0, -4.6],
      [10.2, 0, -2.5],
      [12.4, 0, 3.6],
      [-14.5, 0, 5.6],
      [15.8, 0, 5.5],
    ];
    for (let i = 0; i < treeCoords.length; i += 1) {
      const [tx, ty, tz] = treeCoords[i];
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 1.25, 7), trunkMat);
      trunk.position.set(tx, ty + 0.62, tz);
      trunk.castShadow = true;
      scene.add(trunk);

      const crown = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.85 + (i % 3) * 0.18, 1),
        i % 2 === 0 ? foliageMatA : foliageMatB
      );
      crown.position.set(tx, ty + 1.55, tz);
      crown.scale.set(1.15, 0.82, 1.15);
      crown.castShadow = true;
      crown.receiveShadow = true;
      scene.add(crown);
    }

    // =========================================================================
    // 5. THE 28-STORY SCULPTED TRAVERTINE & LOW-E GLASS SKY-TOWER
    // =========================================================================
    const towerTotalY = computeTowerTotalWorldY();
    const { diffuseTex, emissiveTex } = createFacadeTextures();

    const glassCurtainMat = new THREE.MeshPhysicalMaterial({
      map: diffuseTex,
      emissiveMap: emissiveTex,
      emissive: new THREE.Color('#FFCA82'),
      emissiveIntensity: initialSolar.emissiveWindowFactor * 0.9,
      roughness: 0.12,
      metalness: 0.36,
      reflectivity: 0.85,
      transparent: true,
      opacity: 0.94,
    });

    const slabMat = new THREE.MeshStandardMaterial({
      color: 0xf4eee3,
      roughness: 0.48,
      metalness: 0.08,
      transparent: true,
      opacity: 1.0,
    });

    // Main lower shaft (Stories 1..23)
    const lowerTopY = storyToWorldY(23) + 0.55;
    const lowerBaseY = 2.0;
    const lowerH = lowerTopY - lowerBaseY;
    const lowerGlassCore = new THREE.Mesh(
      new THREE.BoxGeometry(TOWER_FOOTPRINT_WIDTH - 0.16, lowerH, TOWER_FOOTPRINT_DEPTH - 0.16),
      glassCurtainMat
    );
    lowerGlassCore.position.set(0, lowerBaseY + lowerH / 2, 0);
    lowerGlassCore.castShadow = true;
    lowerGlassCore.receiveShadow = true;
    scene.add(lowerGlassCore);

    // Sculpted stepped crown shaft (Stories 24..28)
    const crownBaseY = lowerTopY;
    const crownTopY = towerTotalY - 0.65;
    const crownH = crownTopY - crownBaseY;
    const crownGlassCore = new THREE.Mesh(
      new THREE.BoxGeometry(
        TOWER_FOOTPRINT_WIDTH * 0.88 - 0.14,
        crownH,
        TOWER_FOOTPRINT_DEPTH * 0.88 - 0.14
      ),
      glassCurtainMat
    );
    crownGlassCore.position.set(0, crownBaseY + crownH / 2, 0);
    crownGlassCore.castShadow = true;
    crownGlassCore.receiveShadow = true;
    scene.add(crownGlassCore);

    // 28 Individual cantilevered Italian Travertine floor slabs
    for (let s = 1; s <= SKY_TOWER_TOTAL_STORIES; s += 1) {
      const y = storyToWorldY(s);
      const isCrown = s >= 24;
      const scale = isCrown ? 0.88 : 1.0;
      const overhangBoost = s === 14 || s === 24 || s === 28 ? 0.46 : 0.24;
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(
          TOWER_FOOTPRINT_WIDTH * scale + overhangBoost,
          0.11,
          TOWER_FOOTPRINT_DEPTH * scale + overhangBoost
        ),
        slabMat
      );
      slab.position.set(0, y, 0);
      slab.castShadow = true;
      slab.receiveShadow = true;
      scene.add(slab);
    }

    // Level 14 Sky Garden Lush Botanical Notch
    const skyGardenDeck = new THREE.Mesh(
      new THREE.BoxGeometry(TOWER_FOOTPRINT_WIDTH + 0.18, 0.28, TOWER_FOOTPRINT_DEPTH + 0.18),
      foliageMatB
    );
    skyGardenDeck.position.set(0, storyToWorldY(14) + 0.22, 0);
    scene.add(skyGardenDeck);

    // Fluted Brushed-Brass Architectural Vertical Corner & Center Fins
    const finPositions: Array<[number, number]> = [
      [-TOWER_FOOTPRINT_WIDTH / 2 - 0.05, -TOWER_FOOTPRINT_DEPTH / 2 - 0.05],
      [TOWER_FOOTPRINT_WIDTH / 2 + 0.05, -TOWER_FOOTPRINT_DEPTH / 2 - 0.05],
      [-TOWER_FOOTPRINT_WIDTH / 2 - 0.05, TOWER_FOOTPRINT_DEPTH / 2 + 0.05],
      [TOWER_FOOTPRINT_WIDTH / 2 + 0.05, TOWER_FOOTPRINT_DEPTH / 2 + 0.05],
      [0, TOWER_FOOTPRINT_DEPTH / 2 + 0.07],
      [0, -TOWER_FOOTPRINT_DEPTH / 2 - 0.07],
    ];
    for (const [fx, fz] of finPositions) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.14, lowerH + 0.4, 0.18), brassMat);
      fin.position.set(fx, lowerBaseY + lowerH / 2, fz);
      fin.castShadow = true;
      scene.add(fin);
    }

    // Crown Architectural Portal Arch + Rooftop Infinity Pool + Beacon Spire
    const roofCap = new THREE.Mesh(
      new THREE.BoxGeometry(TOWER_FOOTPRINT_WIDTH * 0.92, 0.22, TOWER_FOOTPRINT_DEPTH * 0.92),
      travertineMat
    );
    roofCap.position.set(0, crownTopY + 0.1, 0);
    roofCap.castShadow = true;
    scene.add(roofCap);

    const roofPoolMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.42,
      roughness: 0.1,
      metalness: 0.3,
    });
    const roofPool = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 1.55), roofPoolMat);
    roofPool.position.set(0, crownTopY + 0.24, 0.65);
    scene.add(roofPool);

    // Sculptural Crown Arch Pillars + Top Beam
    const archLeft = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.75, 0.32), brassMat);
    archLeft.position.set(-2.2, crownTopY + 0.92, -0.5);
    const archRight = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.75, 0.32), brassMat);
    archRight.position.set(2.2, crownTopY + 0.92, -0.5);
    const archTop = new THREE.Mesh(new THREE.BoxGeometry(4.85, 0.24, 0.42), brassMat);
    archTop.position.set(0, crownTopY + 1.82, -0.5);
    const crownBeaconMat = new THREE.MeshStandardMaterial({
      color: 0xfde68a,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.0,
    });
    const crownStrip = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.08, 0.48), crownBeaconMat);
    crownStrip.position.set(0, crownTopY + 1.66, -0.5);
    scene.add(archLeft, archRight, archTop, crownStrip);

    // =========================================================================
    // 6. 12 DIRECTLY CLICKABLE COLOR-CODED 3D APARTMENT UNITS
    // =========================================================================
    const clickableMeshes: THREE.Mesh[] = [];
    const unitBundles = new Map<string, UnitMeshBundle>();

    for (const unit of SKY_TOWER_UNITS) {
      const crownScale = unit.story >= 24 ? 0.88 : 1.0;
      const halfW = (TOWER_FOOTPRINT_WIDTH * crownScale) / 2;
      const halfD = (TOWER_FOOTPRINT_DEPTH * crownScale) / 2;
      const bayH = unit.slabThicknessWorld * 0.88;
      const bayY = unit.worldY + bayH * 0.52;

      const statusCol = STATUS_COLORS_3D[unit.baseStatus];
      const bayMat = new THREE.MeshStandardMaterial({
        color: statusCol.hex,
        emissive: statusCol.emissive,
        emissiveIntensity: 0.32,
        roughness: 0.22,
        metalness: 0.28,
        transparent: true,
        opacity: 0.84,
      });

      const rimMat = new THREE.MeshStandardMaterial({
        color: statusCol.hex,
        emissive: statusCol.emissive,
        emissiveIntensity: 0.65,
        roughness: 0.2,
        metalness: 0.45,
      });

      // Position clickable apartment balcony bay cleanly on its assigned facade
      let bayGeo: THREE.BoxGeometry;
      let rimGeo: THREE.BoxGeometry;
      let px = 0;
      let pz = 0;
      let rpx = 0;
      let rpz = 0;

      if (unit.facadeSide === 'SE_RIVER') {
        const w = halfW * 0.96;
        const d = 0.56;
        bayGeo = new THREE.BoxGeometry(w, bayH, d);
        rimGeo = new THREE.BoxGeometry(w + 0.14, 0.12, d + 0.14);
        px = halfW * 0.48;
        pz = halfD + 0.24;
        rpx = px;
        rpz = pz + 0.04;
      } else if (unit.facadeSide === 'SW_SUNSET') {
        const w = halfW * 0.96;
        const d = 0.56;
        bayGeo = new THREE.BoxGeometry(w, bayH, d);
        rimGeo = new THREE.BoxGeometry(w + 0.14, 0.12, d + 0.14);
        px = -halfW * 0.48;
        pz = halfD + 0.24;
        rpx = px;
        rpz = pz + 0.04;
      } else {
        // NE_LANDMARK81 (East/North-East side bay visible when orbiting East or clicking)
        const w = 0.56;
        const d = halfD * 1.05;
        bayGeo = new THREE.BoxGeometry(w, bayH, d);
        rimGeo = new THREE.BoxGeometry(w + 0.14, 0.12, d + 0.14);
        px = halfW + 0.24;
        pz = -halfD * 0.36;
        rpx = px + 0.04;
        rpz = pz;
      }

      const bayMesh = new THREE.Mesh(bayGeo, bayMat);
      bayMesh.position.set(px, bayY, pz);
      bayMesh.userData = { unitCode: unit.unitCode };
      bayMesh.castShadow = true;
      scene.add(bayMesh);
      clickableMeshes.push(bayMesh);

      const rimMesh = new THREE.Mesh(rimGeo, rimMat);
      rimMesh.position.set(rpx, unit.worldY + 0.08, rpz);
      rimMesh.userData = { unitCode: unit.unitCode };
      scene.add(rimMesh);
      clickableMeshes.push(rimMesh);

      // Selected unit glowing perimeter halo ring wrapping the entire floor
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xf7cf72,
        transparent: true,
        opacity: 0.0,
      });
      const haloGeo = new THREE.BoxGeometry(
        TOWER_FOOTPRINT_WIDTH * crownScale + 0.72,
        0.14,
        TOWER_FOOTPRINT_DEPTH * crownScale + 0.72
      );
      const glowHalo = new THREE.Mesh(haloGeo, haloMat);
      glowHalo.position.set(0, unit.worldY + 0.06, 0);
      scene.add(glowHalo);

      unitBundles.set(unit.unitCode, {
        unitCode: unit.unitCode,
        facadeSide: unit.facadeSide,
        hitMesh: bayMesh,
        rimMat,
        bayMat,
        glowHalo,
        haloMat,
      });
    }

    // =========================================================================
    // 7. X-RAY STRUCTURAL CORE, EXPRESS ELEVATORS & GLOWING FLOORPLATE GROUP
    // =========================================================================
    const xrayGroup = new THREE.Group();
    xrayGroup.visible = false;
    scene.add(xrayGroup);

    // Glowing reinforced concrete core spine
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.82,
      roughness: 0.22,
      metalness: 0.4,
      transparent: true,
      opacity: 0.78,
    });
    const coreSpine = new THREE.Mesh(
      new THREE.BoxGeometry(1.55, towerTotalY - 2.2, 1.48),
      coreMat
    );
    coreSpine.position.set(0, 1.1 + (towerTotalY - 2.2) / 2, 0);
    xrayGroup.add(coreSpine);

    // Wireframe BIM structural exoskeleton cage around core
    const coreWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.62, towerTotalY - 2.2, 1.54)),
      new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.85 })
    );
    coreWire.position.copy(coreSpine.position);
    xrayGroup.add(coreWire);

    // Two animated express elevator cars gliding inside the core
    const liftMat = new THREE.MeshStandardMaterial({
      color: 0xfde68a,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.35,
    });
    const liftCarA = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.56, 0.42), liftMat);
    const liftCarB = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.56, 0.42), liftMat);
    liftCarA.position.set(-0.36, 8, -0.2);
    liftCarB.position.set(0.36, 14, -0.2);
    xrayGroup.add(liftCarA, liftCarB);

    // Dynamic selected-floor BIM cutaway sub-group (rebuilt cleanly when unit changes)
    const xrayFloorGroup = new THREE.Group();
    xrayGroup.add(xrayFloorGroup);
    let lastXRayUnitCode = '';

    const rebuildXRayFloorSlice = (unit: SkyTowerUnit) => {
      while (xrayFloorGroup.children.length > 0) {
        const child = xrayFloorGroup.children.pop();
        if (child) {
          xrayFloorGroup.remove(child);
        }
      }
      const layout = computeXRayFloorplateLayout(unit);

      // Luminous architectural BIM floorplate deck
      const deck = new THREE.Mesh(
        new THREE.BoxGeometry(layout.slabWidth + 0.5, 0.14, layout.slabDepth + 0.5),
        new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          emissive: 0x0ea5e9,
          emissiveIntensity: 0.32,
          roughness: 0.3,
        })
      );
      deck.position.set(0, layout.worldY, 0);
      xrayFloorGroup.add(deck);

      // Illuminated perimeter structural megacolumns
      const colGeo = new THREE.CylinderGeometry(0.11, 0.11, 1.15, 8);
      const colMat = new THREE.MeshStandardMaterial({
        color: 0xe6c78b,
        emissive: 0xb48a3e,
        emissiveIntensity: 0.75,
      });
      for (const col of layout.perimeterColumns) {
        const m = new THREE.Mesh(colGeo, colMat);
        m.position.set(col.x, layout.worldY + 0.58, col.z);
        xrayFloorGroup.add(m);
      }

      // Glowing 3D interior rooms
      for (const room of layout.rooms) {
        const roomGeo = new THREE.BoxGeometry(room.width, room.height, room.depth);
        const roomMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(room.colorHex),
          emissive: new THREE.Color(room.glowHex),
          emissiveIntensity: 0.62,
          transparent: true,
          opacity: 0.72,
          roughness: 0.25,
        });
        const roomMesh = new THREE.Mesh(roomGeo, roomMat);
        roomMesh.position.set(room.x, layout.worldY + room.height / 2 + 0.09, room.z);
        xrayFloorGroup.add(roomMesh);

        const roomEdges = new THREE.LineSegments(
          new THREE.EdgesGeometry(roomGeo),
          new THREE.LineBasicMaterial({ color: new THREE.Color(room.glowHex) })
        );
        roomEdges.position.copy(roomMesh.position);
        xrayFloorGroup.add(roomEdges);
      }
      lastXRayUnitCode = unit.unitCode;
    };
    rebuildXRayFloorSlice(stateRef.current.selectedUnit);

    // =========================================================================
    // 8. BALCONY POV FOREGROUND TERRACE BALUSTRADE (SHOWN ONLY IN BALCONY_POV)
    // =========================================================================
    const balconyPovGroup = new THREE.Group();
    balconyPovGroup.visible = false;
    scene.add(balconyPovGroup);

    const povDeck = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 0.1, 1.6),
      new THREE.MeshStandardMaterial({ color: 0xe8dfd0, roughness: 0.58 })
    );
    povDeck.position.set(0, -0.86, 0.6);
    const povGlass = new THREE.Mesh(
      new THREE.BoxGeometry(4.35, 0.42, 0.05),
      new THREE.MeshPhysicalMaterial({
        color: 0xbfe3f7,
        roughness: 0.08,
        metalness: 0.12,
        transparent: true,
        opacity: 0.28,
      })
    );
    povGlass.position.set(0, -0.62, 1.32);
    const povRail = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.045, 0.08), brassMat);
    povRail.position.set(0, -0.40, 1.32);
    balconyPovGroup.add(povDeck, povGlass, povRail);

    // =========================================================================
    // 9. METRO LINE-1 ELEVATED VIADUCT, SKY STATION & ANIMATED 3-CAR TRAIN
    // =========================================================================
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0xd9d4ca,
      roughness: 0.72,
      metalness: 0.05,
    });
    const darkRailMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.6,
    });

    // Build curved viaduct box-girder segments from pure engine evaluateMetroViaductPoint
    const segments = 28;
    for (let i = 0; i < segments; i += 1) {
      const u0 = -1.1 + (i / segments) * 2.2;
      const u1 = -1.1 + ((i + 1) / segments) * 2.2;
      const p0 = evaluateMetroViaductPoint(u0);
      const p1 = evaluateMetroViaductPoint(u1);
      const segLen = Math.hypot(p1.x - p0.x, p1.z - p0.z) + 0.14;
      const segYaw = Math.atan2(p1.x - p0.x, p1.z - p0.z);

      const deck = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.42, segLen), concreteMat);
      deck.position.set((p0.x + p1.x) / 2, p0.y, (p0.z + p1.z) / 2);
      deck.rotation.y = segYaw;
      deck.castShadow = true;
      deck.receiveShadow = true;
      scene.add(deck);

      // Twin steel guideway rails + subtle cobalt accent trim
      const railTrim = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.08, segLen), darkRailMat);
      railTrim.position.set((p0.x + p1.x) / 2, p0.y + 0.24, (p0.z + p1.z) / 2);
      railTrim.rotation.y = segYaw;
      scene.add(railTrim);
    }

    // Sculptural concrete Y-piers supporting the elevated viaduct
    for (let p = 0; p < 9; p += 1) {
      const u = -0.96 + (p / 8) * 1.92;
      const pt = evaluateMetroViaductPoint(u);
      const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, pt.y + 0.5, 10), concreteMat);
      pier.position.set(pt.x, (pt.y - 0.5) / 2, pt.z);
      pier.castShadow = true;
      pier.receiveShadow = true;
      scene.add(pier);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.34, 0.72), concreteMat);
      cap.position.set(pt.x, pt.y - 0.24, pt.z);
      cap.rotation.y = pt.yawRad;
      cap.castShadow = true;
      scene.add(cap);
    }

    // Architectural Curved Glass Metro Sky Station Canopy (u = 0.14)
    const stationPt = evaluateMetroViaductPoint(0.14);
    const stationGroup = new THREE.Group();
    stationGroup.position.set(stationPt.x, stationPt.y + 0.2, stationPt.z);
    stationGroup.rotation.y = stationPt.yawRad;

    const canopyGlass = new THREE.Mesh(
      new THREE.BoxGeometry(2.65, 0.14, 7.4),
      new THREE.MeshPhysicalMaterial({
        color: 0xdbeafe,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.22,
        roughness: 0.15,
        metalness: 0.2,
        transparent: true,
        opacity: 0.76,
      })
    );
    canopyGlass.position.set(0, 1.38, 0);
    canopyGlass.castShadow = true;
    const canopyArchA = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.12, 0.2), brassMat);
    canopyArchA.position.set(0, 1.42, -3.2);
    const canopyArchB = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.12, 0.2), brassMat);
    canopyArchB.position.set(0, 1.42, 3.2);
    stationGroup.add(canopyGlass, canopyArchA, canopyArchB);
    scene.add(stationGroup);

    // Animated 3-car sleek Hitachi HCMC Metro Line-1 Train
    const metroBodyMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.24,
      metalness: 0.45,
    });
    const metroStripeMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.95,
      roughness: 0.2,
    });
    const metroWindowMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: 0xfbbf24,
      emissiveIntensity: 1.15,
      roughness: 0.15,
    });
    const metroHeadlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x7dd3fc,
      emissiveIntensity: 2.2,
    });

    const metroCarGroups: THREE.Group[] = [0, 1, 2].map((idx) => {
      const car = new THREE.Group();
      const shell = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.78, 3.05), metroBodyMat);
      shell.castShadow = true;
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.18, 3.08), metroStripeMat);
      stripe.position.y = -0.12;
      const windows = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.24, 2.62), metroWindowMat);
      windows.position.y = 0.12;
      car.add(shell, stripe, windows);

      if (idx === 0) {
        const noseLight = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.16, 0.1), metroHeadlightMat);
        noseLight.position.set(0, -0.06, 1.54);
        car.add(noseLight);
      }
      scene.add(car);
      return car;
    });

    // =========================================================================
    // 10. ICONIC BA SON CABLE-STAYED BRIDGE & SAIGON SKYLINE SILHOUETTES
    // =========================================================================
    // Ba Son Bridge (SW River)
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(-22, 0, 18.5);
    bridgeGroup.rotation.y = 0.34;
    const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.35, 36), travertineMat);
    bridgeDeck.position.set(0, 2.4, 0);
    bridgeDeck.castShadow = true;
    const pylonLegA = new THREE.Mesh(new THREE.BoxGeometry(0.45, 11.8, 0.55), travertineMat);
    pylonLegA.position.set(-0.9, 5.8, -1.0);
    pylonLegA.rotation.z = -0.08;
    pylonLegA.rotation.x = 0.14;
    pylonLegA.castShadow = true;
    const pylonLegB = new THREE.Mesh(new THREE.BoxGeometry(0.45, 11.8, 0.55), travertineMat);
    pylonLegB.position.set(0.9, 5.8, -1.0);
    pylonLegB.rotation.z = 0.08;
    pylonLegB.rotation.x = 0.14;
    pylonLegB.castShadow = true;
    bridgeGroup.add(bridgeDeck, pylonLegA, pylonLegB);

    const cableMat = new THREE.MeshBasicMaterial({ color: 0xf4f1ea, transparent: true, opacity: 0.78 });
    for (let c = 1; c <= 6; c += 1) {
      const anchorZ = c * 2.45;
      const topY = 11.2 - c * 0.45;
      const dx = 0;
      const dy = topY - 2.55;
      const dz = anchorZ;
      const len = Math.hypot(dx, dy, dz);
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, len, 4), cableMat);
      cable.position.set(0, 2.55 + dy / 2, dz / 2);
      cable.rotation.x = Math.atan2(dz, dy);
      bridgeGroup.add(cable);
    }
    scene.add(bridgeGroup);

    // Surrounding Saigon Skyline (Landmark 81 NE + Bitexco SW + District 1 Massing with evening glow)
    const skylineMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      emissiveMap: emissiveTex,
      emissive: new THREE.Color('#FFCA82'),
      emissiveIntensity: initialSolar.emissiveWindowFactor * 0.65,
      roughness: 0.52,
      metalness: 0.22,
    });
    const landmarkGlassMat = new THREE.MeshStandardMaterial({
      color: 0x8bb6d6,
      emissiveMap: emissiveTex,
      emissive: new THREE.Color('#FBD38D'),
      emissiveIntensity: 0.16 + initialSolar.emissiveWindowFactor * 0.95,
      roughness: 0.22,
      metalness: 0.45,
    });

    // Landmark 81 inspired bundled glass spire (NE quadrant across river channel)
    const lm81 = new THREE.Group();
    lm81.position.set(27, 0, -28);
    const lmTiers: Array<[number, number, number, number]> = [
      [0, 0, 2.5, 16.5],
      [0.85, 0.65, 1.55, 20.5],
      [-0.75, 0.45, 1.45, 22.8],
      [0.15, -0.55, 1.4, 25.6],
    ];
    for (const [lx, lz, lw, lh] of lmTiers) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(lw, lh, lw), landmarkGlassMat);
      m.position.set(lx, lh / 2, lz);
      lm81.add(m);
    }
    const lmSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.16, 4.5, 6), brassMat);
    lmSpire.position.set(0.15, 27.8, -0.55);
    lm81.add(lmSpire);
    scene.add(lm81);

    // Bitexco Financial Tower silhouette + iconic circular helipad (District 1 opposite bank)
    const bitexco = new THREE.Group();
    bitexco.position.set(-24, 0, -27);
    const bBody = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 2.0, 17.5, 12), landmarkGlassMat);
    bBody.position.y = 8.75;
    const bHelipad = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.35, 0.26, 16), travertineMat);
    bHelipad.position.set(1.85, 12.8, 0.6);
    bitexco.add(bBody, bHelipad);
    scene.add(bitexco);

    // Taste-calibrated District 1 & Binh Thanh silhouettes across the Saigon River
    const bgTowers: Array<[number, number, number, number, number]> = [
      [-18, -32, 3.2, 10.5, 2.8],
      [-12, -35, 3.6, 13.4, 3.2],
      [-5, -38, 4.0, 9.8, 3.4],
      [9, -36, 3.5, 12.2, 3.0],
      [16, -33, 3.2, 14.8, 3.0],
      [21, -36, 2.8, 11.6, 2.8],
      [34, -27, 3.4, 12.5, 3.0],
      [-33, -27, 3.2, 11.2, 3.0],
      [-29, -34, 3.0, 9.4, 2.6],
      [14, -27, 2.8, 8.6, 2.5],
      [-11, -27, 2.6, 7.4, 2.4],
      // South-East & South-West Saigon riverfront skyline (visible in Balcony POV!)
      [28, 38, 3.4, 11.2, 3.0],
      [35, 42, 3.0, 14.5, 3.0],
      [42, 34, 3.2, 9.6, 2.8],
      [18, 46, 3.6, 10.4, 3.0],
      [-26, 40, 3.2, 12.2, 3.0],
      [-34, 34, 3.4, 15.0, 3.2],
    ];
    for (const [bx, bz, bw, bh, bd] of bgTowers) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), skylineMat);
      m.position.set(bx, bh / 2, bz);
      m.receiveShadow = true;
      scene.add(m);
    }

    // Sleek white luxury river cruisers moored/gliding on the Saigon River (seen from Balcony POV & Orbit)
    const yachtMat = new THREE.MeshStandardMaterial({ color: 0xfaf8f4, roughness: 0.25, metalness: 0.2 });
    const yachtSpots: Array<[number, number, number]> = [
      [14, 17.5, 0.45],
      [22, 23.0, -0.35],
      [-8, 22.5, 0.72],
    ];
    for (const [yx, yz, yRot] of yachtSpots) {
      const yacht = new THREE.Group();
      const hull = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.26, 2.9), yachtMat);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.28, 1.35), landmarkGlassMat);
      cabin.position.set(0, 0.24, -0.2);
      yacht.add(hull, cabin);
      yacht.position.set(yx, -0.04, yz);
      yacht.rotation.y = yRot;
      scene.add(yacht);
    }

    // =========================================================================
    // 11. DIRECT 3D RAYCASTING & DAMPED POINTER ORBIT / POV INTERACTION
    // =========================================================================
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();

    const pickUnitAtEvent = (clientX: number, clientY: number): string | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(clickableMeshes, false);
      if (hits.length > 0) {
        const code = hits[0].object.userData?.unitCode;
        return typeof code === 'string' ? code : null;
      }
      return null;
    };

    const onPointerDown = (e: PointerEvent) => {
      stateRef.current.isDragging = true;
      stateRef.current.dragStartX = e.clientX;
      stateRef.current.dragStartY = e.clientY;
      stateRef.current.dragMovedPx = 0;
      renderer.domElement.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      const st = stateRef.current;
      if (st.isDragging) {
        const dx = e.clientX - st.dragStartX;
        const dy = e.clientY - st.dragStartY;
        st.dragMovedPx += Math.hypot(dx, dy);
        st.dragStartX = e.clientX;
        st.dragStartY = e.clientY;

        if (st.cameraMode === 'BALCONY_POV') {
          st.povYawOffsetRad = Math.max(-0.75, Math.min(0.75, st.povYawOffsetRad - dx * 0.0045));
          st.povPitchOffsetRad = Math.max(-0.28, Math.min(0.32, st.povPitchOffsetRad - dy * 0.0035));
        } else {
          st.orbitAzimuthRad -= dx * 0.0068;
          st.orbitElevationRad = Math.max(0.12, Math.min(0.72, st.orbitElevationRad + dy * 0.005));
        }
        renderer.domElement.style.cursor = 'grabbing';
        return;
      }

      const hovered = pickUnitAtEvent(e.clientX, e.clientY);
      if (hovered !== st.hoveredUnitCode) {
        setHoveredUnitCode(hovered);
      }
      renderer.domElement.style.cursor = hovered ? 'pointer' : 'grab';
    };

    const onPointerUp = (e: PointerEvent) => {
      const st = stateRef.current;
      if (!st.isDragging) return;
      st.isDragging = false;
      try {
        renderer.domElement.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if capture was released
      }

      // Distinguish crisp click (< 6px drag) from camera orbit drag
      if (st.dragMovedPx < 6) {
        const clickedCode = pickUnitAtEvent(e.clientX, e.clientY);
        if (clickedCode) {
          handleSelectUnitByCode(clickedCode);
        }
      }
      renderer.domElement.style.cursor = 'grab';
    };

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return; // Never hijack normal vertical page scrolling
      e.preventDefault();
      stateRef.current.orbitDistance = Math.min(
        50,
        Math.max(22, stateRef.current.orbitDistance + e.deltaY * 0.02)
      );
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // Responsive ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(300, Math.round(entry.contentRect.width));
        const h = Math.max(280, Math.round(entry.contentRect.height));
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    // =========================================================================
    // 12. 60FPS REAL-TIME ANIMATION LOOP
    // =========================================================================
    const startMs = performance.now();
    let rafId = 0;
    let lastHudSyncMs = 0;
    let lastAppliedSolarHour = -1;
    const targetCamPos = new THREE.Vector3();
    const targetLookVec = new THREE.Vector3();

    const animate = (nowMs: number) => {
      rafId = window.requestAnimationFrame(animate);
      const elapsedSec = (nowMs - startMs) * 0.001;
      const st = stateRef.current;

      // 1) Update Sun-Path shadows, lighting, sky dome & golden-hour interior window glow
      if (Math.abs(st.solarHour - lastAppliedSolarHour) > 0.001) {
        lastAppliedSolarHour = st.solarHour;
        const sol = computeSaigonSolarState(st.solarHour);
        sunLight.position.set(sol.sunPosition.x, sol.sunPosition.y, sol.sunPosition.z);
        sunLight.color.set(sol.sunColorHex);
        sunLight.intensity = sol.sunIntensity;

        hemiLight.color.set(sol.skyTopColorHex);
        hemiLight.groundColor.set(sol.ambientColorHex);
        hemiLight.intensity = sol.ambientIntensity;

        scene.background = new THREE.Color(sol.skyHorizonColorHex);
        if (scene.fog instanceof THREE.FogExp2) {
          scene.fog.color.set(sol.fogColorHex);
        }
        updateSkyDomeColors(sol.skyTopColorHex, sol.skyHorizonColorHex);

        sunDisc.position.set(sol.sunPosition.x * 1.65, Math.max(6, sol.sunPosition.y * 1.65), sol.sunPosition.z * 1.65);
        sunDiscMat.color.set(sol.sunColorHex);
        sunHalo.position.copy(sunDisc.position);
        sunHaloMat.color.set(sol.sunColorHex);

        riverMat.color.set(sol.riverTintHex);
        glassCurtainMat.emissiveIntensity = sol.emissiveWindowFactor * 1.15;
        skylineMat.emissiveIntensity = sol.emissiveWindowFactor * 0.72;
        landmarkGlassMat.emissiveIntensity = 0.16 + sol.emissiveWindowFactor * 1.05;
        lobbyMat.emissiveIntensity = 0.35 + sol.emissiveWindowFactor * 0.95;
        crownBeaconMat.emissiveIntensity = 0.45 + sol.emissiveWindowFactor * 1.45;
      }

      // 2) Subtle Saigon River shimmering water motion
      waterNormalTex.offset.x = (elapsedSec * 0.018) % 1;
      waterNormalTex.offset.y = (elapsedSec * 0.009) % 1;

      // 3) Animate Metro Line-1 3-car train smoothly across the riverfront viaduct
      // Offset +2.8s places the glowing 3-car Hitachi train squarely in center hero view on arrival
      const metro = computeMetroTrainState(elapsedSec + 2.8);
      for (let i = 0; i < metro.cars.length; i += 1) {
        const pose = metro.cars[i];
        const carGroup = metroCarGroups[i];
        carGroup.position.set(pose.x, pose.y, pose.z);
        carGroup.rotation.y = pose.yawRad;
      }
      metroHeadlightMat.emissiveIntensity = 1.4 + metro.headlightGlow * 1.2;

      if (nowMs - lastHudSyncMs > 450) {
        lastHudSyncMs = nowMs;
        setMetroHudInfo({
          speedKmh: metro.speedKmh,
          station: lang === 'vi' ? metro.nextStationVi : metro.nextStationEn,
        });
      }

      // 4) Update unit colors (Escrow locks, hover highlight, selected pulsing gold halo)
      const pulse = 0.55 + 0.45 * Math.sin(elapsedSec * 3.6);
      for (const unit of SKY_TOWER_UNITS) {
        const bundle = unitBundles.get(unit.unitCode);
        if (!bundle) continue;
        const effStatus = getEffectiveUnitStatus(unit, st.escrowRegistry);
        const cols = STATUS_COLORS_3D[effStatus];
        const isSelected = unit.unitCode === st.selectedUnit.unitCode;
        const isHovered = unit.unitCode === st.hoveredUnitCode;

        bundle.rimMat.color.setHex(isSelected ? 0xf7cf72 : cols.hex);
        bundle.rimMat.emissive.setHex(isSelected ? 0xeab308 : cols.emissive);
        bundle.rimMat.emissiveIntensity = isSelected ? 1.15 + pulse * 0.45 : isHovered ? 1.0 : 0.62;

        bundle.bayMat.color.setHex(cols.hex);
        bundle.bayMat.emissive.setHex(cols.emissive);
        bundle.bayMat.emissiveIntensity = isSelected ? 0.65 + pulse * 0.25 : isHovered ? 0.55 : 0.26;
        bundle.bayMat.opacity = st.cameraMode === 'XRAY' ? (isSelected ? 0.28 : 0.14) : 0.86;

        bundle.haloMat.opacity = isSelected ? 0.45 + pulse * 0.42 : isHovered ? 0.3 : 0.0;
      }

      // 5) Smooth X-Ray Glass Peel & Express Elevator Animation
      const isXRay = st.cameraMode === 'XRAY';
      const targetGlassOpacity = isXRay ? 0.14 : 0.94;
      const targetSlabOpacity = isXRay ? 0.22 : 1.0;
      glassCurtainMat.opacity += (targetGlassOpacity - glassCurtainMat.opacity) * 0.12;
      slabMat.opacity += (targetSlabOpacity - slabMat.opacity) * 0.12;
      xrayGroup.visible = isXRay || glassCurtainMat.opacity < 0.72;

      if (xrayGroup.visible) {
        if (lastXRayUnitCode !== st.selectedUnit.unitCode) {
          rebuildXRayFloorSlice(st.selectedUnit);
        }
        liftCarA.position.y = 3.2 + ((Math.sin(elapsedSec * 0.65) + 1) / 2) * (towerTotalY - 5.2);
        liftCarB.position.y = 3.2 + ((Math.cos(elapsedSec * 0.52) + 1) / 2) * (towerTotalY - 5.2);
      }

      // 6) Balcony POV foreground balustrade alignment
      const isPov = st.cameraMode === 'BALCONY_POV';
      balconyPovGroup.visible = isPov;
      if (isPov) {
        const bp = st.selectedUnit.balconyWorldPos;
        const bt = st.selectedUnit.balconyLookTarget;
        balconyPovGroup.position.set(bp.x, bp.y, bp.z);
        balconyPovGroup.rotation.y = Math.atan2(bt.x - bp.x, bt.z - bp.z);
      }

      // 7) Smoothly interpolate Camera position, lookAt & FOV across modes and selected units
      const preset = computeCameraPreset(
        st.cameraMode,
        st.selectedUnit,
        st.orbitAzimuthRad,
        st.orbitElevationRad,
        st.orbitDistance
      );

      if (isPov) {
        const baseDx = preset.target.x - preset.position.x;
        const baseDz = preset.target.z - preset.position.z;
        const baseYaw = Math.atan2(baseDx, baseDz) + st.povYawOffsetRad;
        const lookDist = 28;
        targetCamPos.set(preset.position.x, preset.position.y, preset.position.z);
        targetLookVec.set(
          preset.position.x + Math.sin(baseYaw) * lookDist,
          preset.target.y + Math.sin(st.povPitchOffsetRad) * 14,
          preset.position.z + Math.cos(baseYaw) * lookDist
        );
      } else {
        targetCamPos.set(preset.position.x, preset.position.y, preset.position.z);
        targetLookVec.set(preset.target.x, preset.target.y, preset.target.z);
      }

      const lerpAlpha = 0.085;
      camera.position.lerp(targetCamPos, lerpAlpha);
      currentLookTarget.lerp(targetLookVec, lerpAlpha);
      camera.lookAt(currentLookTarget);

      if (Math.abs(camera.fov - preset.fov) > 0.05) {
        camera.fov += (preset.fov - camera.fov) * 0.1;
        camera.updateProjectionMatrix();
      }

      renderer.render(scene, camera);
    };

    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      diffuseTex.dispose();
      emissiveTex.dispose();
      waterNormalTex.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [handleSelectUnitByCode, lang]);

  const statusPillStyle = (st: SkyTowerUnitStatus) => {
    if (st === 'Available') {
      return {
        dot: '#10B981',
        bg: 'rgba(16, 185, 129, 0.14)',
        border: 'rgba(16, 185, 129, 0.42)',
        text: '#0F7655',
      };
    }
    if (st === 'Reserved') {
      return {
        dot: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.14)',
        border: 'rgba(245, 158, 11, 0.44)',
        text: '#B46A1A',
      };
    }
    return {
      dot: '#64748B',
      bg: 'rgba(100, 116, 139, 0.14)',
      border: 'rgba(100, 116, 139, 0.4)',
      text: '#475569',
    };
  };

  const activePill = statusPillStyle(effectiveStatus);
  const hudGlassBg =
    theme === 'dark' ? 'rgba(14, 24, 43, 0.92)' : 'rgba(250, 248, 244, 0.93)';

  return (
    <div
      className="relative w-full overflow-hidden border-t-2 border-r border-b border-l"
      style={{
        borderTopColor: 'var(--accent)',
        borderRightColor: 'var(--border-subtle)',
        borderBottomColor: 'var(--border-subtle)',
        borderLeftColor: 'var(--border-subtle)',
        backgroundColor: 'var(--bg-secondary)',
        boxShadow: 'var(--shadow-editorial)',
      }}
      tabIndex={0}
      onKeyDown={handleStageKeyDown}
      data-testid="saigon-sky-tower-3d-stage"
    >
      {/* Primary 60fps Three.js PBR Viewport */}
      <div className="relative h-[340px] w-full sm:h-[440px] lg:h-[530px]">
        {!webglFailed ? (
          <div ref={mountRef} className="h-full w-full select-none" />
        ) : (
          /* Graceful Architectural Isometric Fallback when headless/no-WebGL */
          <div
            className="architectural-grid flex h-full w-full flex-col items-center justify-center p-6 text-center"
            style={{
              background: `linear-gradient(180deg, ${solarState.skyTopColorHex} 0%, ${solarState.skyHorizonColorHex} 68%, ${solarState.riverTintHex} 100%)`,
            }}
          >
            <svg viewBox="0 0 360 220" className="h-56 w-auto max-w-full" role="img" aria-label="Saigon Sky-Tower Architectural Elevation Fallback">
              <rect x="0" y="162" width="360" height="58" fill={solarState.riverTintHex} opacity="0.88" />
              <line x1="12" y1="154" x2="348" y2="146" stroke="#D9D4CA" strokeWidth="6" />
              <rect x="148" y="24" width="64" height="136" fill="#F1EBE0" stroke="#B48A3E" strokeWidth="1.5" />
              {SKY_TOWER_UNITS.slice(0, 8).map((u, idx) => {
                const st = getEffectiveUnitStatus(u, escrowRegistry);
                const col = st === 'Available' ? '#10B981' : st === 'Reserved' ? '#F59E0B' : '#64748B';
                return (
                  <rect
                    key={u.unitCode}
                    x={152}
                    y={142 - idx * 14}
                    width={56}
                    height={9}
                    fill={col}
                    opacity={u.unitCode === selectedUnit.unitCode ? 1 : 0.72}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSelectUnitByCode(u.unitCode)}
                  />
                );
              })}
            </svg>
            <div
              className="font-mono-tabular mt-2 rounded-sm border px-3 py-1 text-[10px] font-semibold uppercase"
              style={{ backgroundColor: hudGlassBg, borderColor: 'var(--border-strong)', color: 'var(--text-heading)' }}
            >
              ARCHITECTURAL VECTOR FALLBACK · {selectedUnit.unitCode} · {solarState.clockLabel}
            </div>
          </div>
        )}

        {/* Top-Left Camera Mode Bar & Live Metro Telemetry */}
        <div className="pointer-events-none absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 lg:right-[306px]">
          <div
            className="pointer-events-auto inline-flex flex-wrap items-center gap-1 rounded-sm border p-1 backdrop-blur-md"
            style={{ backgroundColor: hudGlassBg, borderColor: 'var(--border-strong)' }}
            role="tablist"
            aria-label="3D Camera Modes"
          >
            {(
              [
                {
                  id: 'ORBIT' as SkyTowerCameraMode,
                  shortEn: 'ORBIT',
                  shortVi: '3D',
                  labelEn: 'ORBIT TOWER',
                  labelVi: 'XOAY THÁP 3D',
                  icon: (
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5" aria-hidden="true">
                      <path d="M10 2.5 16.5 6v8L10 17.5 3.5 14V6L10 2.5Z" strokeLinejoin="round" />
                      <path d="M10 10v7.5M10 10l6.5-4M10 10 3.5 6" />
                    </svg>
                  ),
                },
                {
                  id: 'BALCONY_POV' as SkyTowerCameraMode,
                  shortEn: 'POV',
                  shortVi: 'BAN CÔNG',
                  labelEn: 'BALCONY POV',
                  labelVi: 'GÓC NHÌN BAN CÔNG',
                  icon: (
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5" aria-hidden="true">
                      <path d="M2.5 10s2.8-4.5 7.5-4.5S17.5 10 17.5 10s-2.8 4.5-7.5 4.5S2.5 10 2.5 10Z" />
                      <circle cx="10" cy="10" r="2.1" />
                    </svg>
                  ),
                },
                {
                  id: 'XRAY' as SkyTowerCameraMode,
                  shortEn: 'X-RAY',
                  shortVi: 'X-QUANG',
                  labelEn: 'X-RAY FLOORPLATE',
                  labelVi: 'X-QUANG LÕI & MẶT BẰNG',
                  icon: (
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5" aria-hidden="true">
                      <path d="M10 3 17 6.8 10 10.6 3 6.8 10 3Z" strokeLinejoin="round" />
                      <path d="M3 10.5 10 14.3 17 10.5M3 14.1 10 17.8 17 14.1" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                },
              ]
            ).map((m) => {
              const active = cameraMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  data-testid={`mode-${m.id.toLowerCase()}`}
                  onClick={() => setCameraMode(m.id)}
                  className="font-mono-tabular inline-flex cursor-pointer items-center gap-1.5 rounded-sm px-2 py-1.5 text-[10px] font-semibold tracking-[0.09em] uppercase transition-all sm:px-2.5"
                  style={{
                    backgroundColor: active ? 'var(--cta-bg)' : 'transparent',
                    color: active ? 'var(--cta-ink)' : 'var(--text-heading)',
                  }}
                >
                  <span style={{ color: 'var(--accent)' }}>{m.icon}</span>
                  <span className="sm:hidden">{lang === 'vi' ? m.shortVi : m.shortEn}</span>
                  <span className="hidden sm:inline">{lang === 'vi' ? m.labelVi : m.labelEn}</span>
                </button>
              );
            })}
          </div>

          {/* Live Metro Line-1 & Zoom Pill */}
          <div className="pointer-events-auto hidden items-center gap-1.5 sm:flex">
            <div
              className="font-mono-tabular inline-flex items-center gap-2 rounded-sm border px-2.5 py-1.5 text-[10px] font-semibold backdrop-blur-md"
              style={{
                backgroundColor: hudGlassBg,
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-heading)',
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#0EA5E9]" />
              <span className="tracking-[0.08em] uppercase">METRO LINE-1</span>
              <span style={{ color: 'var(--accent)' }}>{metroHudInfo.speedKmh} KM/H</span>
              <span className="hidden xl:inline" style={{ color: 'var(--text-muted)' }}>
                · {metroHudInfo.station}
              </span>
            </div>

            {cameraMode !== 'BALCONY_POV' && (
              <div
                className="inline-flex items-center rounded-sm border backdrop-blur-md"
                style={{ backgroundColor: hudGlassBg, borderColor: 'var(--border-subtle)' }}
              >
                <button
                  type="button"
                  onClick={() => handleZoomDelta(-3.5)}
                  aria-label="Zoom In"
                  className="font-mono-tabular cursor-pointer px-2 py-1 text-xs font-semibold hover:opacity-75"
                  style={{ color: 'var(--text-heading)' }}
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => handleZoomDelta(3.5)}
                  aria-label="Zoom Out"
                  className="font-mono-tabular cursor-pointer border-x px-2 py-1 text-xs font-semibold hover:opacity-75"
                  style={{ color: 'var(--text-heading)', borderColor: 'var(--border-subtle)' }}
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={handleResetView}
                  aria-label="Reset Camera"
                  className="font-mono-tabular cursor-pointer px-2 py-1 text-[10px] font-semibold uppercase hover:opacity-75"
                  style={{ color: 'var(--accent)' }}
                >
                  RST
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Hover Raycast Micro-Callout */}
        {hoveredUnitCode && hoveredUnitCode !== selectedUnit.unitCode && (
          <div
            className="font-mono-tabular pointer-events-none absolute top-14 left-3 z-20 rounded-sm border px-2.5 py-1 text-[10px] font-semibold uppercase backdrop-blur-md"
            style={{
              backgroundColor: hudGlassBg,
              borderColor: 'var(--accent)',
              color: 'var(--text-heading)',
            }}
          >
            {lang === 'vi' ? 'NHẤN ĐỂ XEM TẦNG' : 'CLICK TO INSPECT'} · {hoveredUnitCode}
          </div>
        )}

        {/* Balcony POV Sightline Compass Ribbon */}
        {cameraMode === 'BALCONY_POV' && (
          <div
            className="font-mono-tabular pointer-events-none absolute top-14 left-3 z-20 inline-flex items-center gap-2 rounded-sm border px-3 py-1.5 text-[10px] font-semibold uppercase backdrop-blur-md"
            style={{
              backgroundColor: hudGlassBg,
              borderColor: 'var(--accent)',
              color: 'var(--text-heading)',
            }}
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} aria-hidden="true">
              <circle cx="10" cy="10" r="7.5" />
              <polygon points="13,7 11.2,11.2 7,13 8.8,8.8" fill="currentColor" stroke="none" />
            </svg>
            <span>
              {selectedUnit.unitCode} · F{selectedUnit.story} ({Math.round(selectedUnit.floorHeightM)}m) ·{' '}
              {lang === 'vi' ? selectedUnit.sightlineLabelVi : selectedUnit.sightlineLabel}
            </span>
          </div>
        )}

        {/* Desktop Floating Bottom Sun-Path Scrubber & Unit Strip */}
        <div
          className="hidden border p-3 backdrop-blur-md lg:absolute lg:right-[306px] lg:bottom-3 lg:left-3 lg:z-20 lg:block"
          style={{
            backgroundColor: hudGlassBg,
            borderColor: 'var(--border-strong)',
          }}
        >
          {/* Row 1: Tropical Sun-Path Scrubber */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsSunPlaying((p) => !p)}
              aria-label={isSunPlaying ? 'Pause Sun Cycle' : 'Play Sun Cycle'}
              className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-sm border transition-colors"
              style={{
                backgroundColor: isSunPlaying ? 'var(--accent)' : 'var(--cta-bg)',
                borderColor: 'var(--cta-bg)',
                color: 'var(--cta-ink)',
              }}
            >
              {isSunPlaying ? (
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3" aria-hidden="true">
                  <rect x="3.5" y="3" width="3" height="10" />
                  <rect x="9.5" y="3" width="3" height="10" />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3" aria-hidden="true">
                  <polygon points="4,2.8 13,8 4,13.2" />
                </svg>
              )}
            </button>

            <div className="flex items-center gap-1">
              {SUN_PRESETS.map((preset) => {
                const active = Math.abs(solarHour - preset.hour) < 0.35;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    data-testid={`sun-preset-${preset.id}`}
                    onClick={() => {
                      setIsSunPlaying(false);
                      setSolarHour(preset.hour);
                    }}
                    className="font-mono-tabular cursor-pointer rounded-sm border px-2 py-1 text-[10px] font-semibold transition-all"
                    style={{
                      borderColor: active ? 'var(--accent)' : 'var(--border-subtle)',
                      backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-secondary)',
                      color: active ? 'var(--text-heading)' : 'var(--text-secondary)',
                    }}
                  >
                    {lang === 'vi' ? preset.labelVi : preset.labelEn}
                  </button>
                );
              })}
            </div>

            <div className="flex min-w-[150px] flex-1 items-center gap-2.5">
              <input
                type="range"
                min={6}
                max={18.5}
                step={0.25}
                value={solarHour}
                aria-label="Saigon Tropical Sun-Path Hour"
                data-testid="sun-path-scrubber"
                onChange={(e) => {
                  setIsSunPlaying(false);
                  setSolarHour(parseFloat(e.target.value));
                }}
                className="kinetix-slider flex-1"
              />
              <span
                className="font-mono-tabular shrink-0 rounded-sm border px-2 py-0.5 text-[10.5px] font-semibold"
                style={{
                  borderColor: 'var(--border-subtle)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-heading)',
                }}
              >
                {solarState.clockLabel} · {solarState.elevationDeg.toFixed(0)}° · {solarState.colorTemperatureK}K
              </span>
            </div>
          </div>

          {/* Row 2: Direct Floor Quick-Pick Chips & Status Legend */}
          <div
            className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t pt-2"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className="font-mono-tabular mr-1 text-[9.5px] font-semibold tracking-[0.14em] uppercase"
                style={{ color: 'var(--text-muted)' }}
              >
                {lang === 'vi' ? 'CHỌN CĂN 3D:' : '3D UNITS:'}
              </span>
              {QUICK_UNIT_CODES.map((code) => {
                const u = getSkyTowerUnitByCode(code)!;
                const st = getEffectiveUnitStatus(u, escrowRegistry);
                const pill = statusPillStyle(st);
                const isSelected = code === selectedUnit.unitCode;
                return (
                  <button
                    key={code}
                    type="button"
                    data-testid={`unit-chip-${code}`}
                    onClick={() => handleSelectUnitByCode(code)}
                    className="font-mono-tabular inline-flex cursor-pointer items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10px] font-semibold transition-all"
                    style={{
                      borderColor: isSelected ? 'var(--accent)' : 'var(--border-subtle)',
                      backgroundColor: isSelected ? 'var(--cta-bg)' : 'var(--bg-secondary)',
                      color: isSelected ? 'var(--cta-ink)' : 'var(--text-heading)',
                    }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: pill.dot }} />
                    <span>{code}</span>
                  </button>
                );
              })}
            </div>

            <div className="font-mono-tabular flex items-center gap-2.5 text-[9.5px]" style={{ color: 'var(--text-muted)' }}>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                {lang === 'vi' ? 'Mở Bán' : 'Available'}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
                {lang === 'vi' ? 'Ký Quỹ' : 'Reserved'}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#64748B]" />
                {lang === 'vi' ? 'Đã Bán' : 'Sold'}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Floating Right Architectural Telemetry & Escrow HUD */}
        <aside
          aria-label="Selected Unit Architectural Telemetry"
          data-testid="escrow-telemetry-hud"
          className="hidden overflow-y-auto border p-3 backdrop-blur-md lg:absolute lg:top-3 lg:right-3 lg:bottom-3 lg:z-20 lg:flex lg:w-[280px] lg:flex-col lg:justify-between"
          style={{
            backgroundColor: hudGlassBg,
            borderColor: 'var(--border-strong)',
          }}
        >
          <div>
            {/* Eyebrow & Status */}
            <div className="flex items-center justify-between gap-2">
              <span
                className="font-mono-tabular text-[9.5px] font-semibold tracking-[0.18em] uppercase"
                style={{ color: 'var(--accent)' }}
              >
                {lang === 'vi' ? 'TỌA ĐỘ TẦNG 3D · v5.0' : '3D TOWER TELEMETRY · v5.0'}
              </span>
              <span
                className="font-mono-tabular inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[9.5px] font-semibold uppercase"
                style={{
                  backgroundColor: activePill.bg,
                  borderColor: activePill.border,
                  color: activePill.text,
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: activePill.dot }} />
                {effectiveStatus}
              </span>
            </div>

            {/* Unit Code & Name */}
            <div className="mt-2 flex items-baseline justify-between gap-2 border-b pb-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <div className="font-mono-tabular text-xl leading-none font-bold" style={{ color: 'var(--text-heading)' }}>
                  {selectedUnit.unitCode}
                </div>
                <div className="mt-1 text-xs font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
                  {lang === 'vi' ? selectedUnit.nameVi : selectedUnit.nameEn}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono-tabular text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                  F{selectedUnit.story}/{SKY_TOWER_TOTAL_STORIES}
                </div>
                <div className="font-mono-tabular text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {Math.round(computeStoryElevationM(selectedUnit.story))}m · {selectedUnit.areaSqm}m²
                </div>
              </div>
            </div>

            {/* Balcony Sightline Score */}
            <div className="mt-2.5 rounded-sm border p-2.5" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono-tabular text-[9.5px] font-semibold tracking-[0.12em] uppercase" style={{ color: 'var(--text-muted)' }}>
                  {lang === 'vi' ? 'TẦM NHÌN BAN CÔNG' : 'BALCONY SIGHTLINE'}
                </span>
                <span className="font-mono-tabular text-xs font-bold" style={{ color: 'var(--accent)' }}>
                  {selectedUnit.sightlineScore}/100
                </span>
              </div>
              <div className="mt-1 text-[11px] font-semibold" style={{ color: 'var(--text-heading)' }}>
                {lang === 'vi' ? selectedUnit.orientationLabelVi : selectedUnit.orientationLabel}
              </div>
              <div className="mt-0.5 text-[10.5px]" style={{ color: 'var(--text-secondary)' }}>
                {lang === 'vi' ? selectedUnit.sightlineLabelVi : selectedUnit.sightlineLabel}
              </div>
            </div>

            {/* 2x2 Architectural & Financial Metrics */}
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <div className="rounded-sm border p-2" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="text-[9.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>
                  {lang === 'vi' ? 'GIÁ NIÊM YẾT' : 'LIST PRICE'}
                </div>
                <div className="font-mono-tabular mt-1 text-xs font-bold" style={{ color: 'var(--text-heading)' }}>
                  {formatCurrency(selectedUnit.priceVnd, currency, lang, { compact: true })}
                </div>
              </div>

              <div className="rounded-sm border p-2" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="text-[9.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>
                  {lang === 'vi' ? 'LỢI SUẤT THUÊ' : 'RENTAL YIELD'}
                </div>
                <div className="font-mono-tabular mt-1 text-xs font-bold" style={{ color: 'var(--status-available)' }}>
                  {selectedUnit.rentalYieldPct.toFixed(1)}% / yr
                </div>
              </div>

              <div className="rounded-sm border p-2" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="text-[9.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>
                  {lang === 'vi' ? 'BỨC XẠ NHIỆT' : 'SOLAR HEAT GAIN'}
                </div>
                <div className="font-mono-tabular mt-1 text-xs font-bold" style={{ color: 'var(--text-heading)' }}>
                  {unitSolar.solarHeatGainKwM2.toFixed(3)} kW/m²
                </div>
              </div>

              <div className="rounded-sm border p-2" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="text-[9.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>
                  {lang === 'vi' ? 'CHE BÓNG BAN CÔNG' : 'BALCONY SHADE'}
                </div>
                <div className="font-mono-tabular mt-1 text-xs font-bold" style={{ color: 'var(--accent)' }}>
                  {unitSolar.balconyShadePct}%
                </div>
              </div>
            </div>

            {/* X-Ray BIM Room Cutaway Legend when X-Ray Mode is Active */}
            {cameraMode === 'XRAY' && (
              <div
                className="mt-2.5 rounded-sm border p-2"
                style={{ borderColor: 'var(--border-strong)', backgroundColor: 'var(--accent-soft)' }}
              >
                <div className="font-mono-tabular text-[9.5px] font-semibold tracking-[0.14em] uppercase" style={{ color: 'var(--accent)' }}>
                  X-RAY BIM CORE · {xrayLayout.rooms.length} VOLUMES
                </div>
                <div className="mt-1.5 grid grid-cols-2 gap-1">
                  {xrayLayout.rooms.map((rm) => (
                    <div key={rm.id} className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-heading)' }}>
                      <span className="h-2 w-2 shrink-0 rounded-xs" style={{ backgroundColor: rm.colorHex }} />
                      <span className="truncate">{lang === 'vi' ? rm.labelVi : rm.labelEn}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Idempotent 201 / 409 Escrow Feedback Banner */}
            {lastLockResult && (
              <div
                data-testid="escrow-lock-feedback"
                className="mt-2 rounded-sm border p-1.5 text-[10px] leading-snug"
                style={{
                  borderColor:
                    lastLockResult.httpStatus === 409
                      ? 'var(--status-sold-border)'
                      : 'var(--status-available-border)',
                  backgroundColor:
                    lastLockResult.httpStatus === 409
                      ? 'var(--status-sold-bg)'
                      : 'var(--status-available-bg)',
                  color: 'var(--text-heading)',
                }}
              >
                <div
                  className="font-mono-tabular text-[9.5px] font-bold uppercase"
                  style={{
                    color:
                      lastLockResult.httpStatus === 409
                        ? 'var(--status-sold)'
                        : 'var(--status-available)',
                  }}
                >
                  HTTP {lastLockResult.httpStatus} · {lastLockResult.outcome.replace(/_/g, ' ')}
                </div>
                <div className="mt-0.5">{lang === 'vi' ? lastLockResult.messageVi : lastLockResult.messageEn}</div>
              </div>
            )}
          </div>

          {/* Primary Escrow 409 CTA & VietQR / VIP Viewing Wiring */}
          <div className="mt-3 space-y-1.5">
            <button
              type="button"
              data-testid="lock-escrow-btn"
              onClick={handleLockEscrow}
              className="font-mono-tabular flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm border px-3 py-2.5 text-[11px] font-semibold tracking-[0.12em] uppercase transition-all hover:opacity-92"
              style={{
                backgroundColor: 'var(--cta-bg)',
                borderColor: 'var(--cta-bg)',
                color: 'var(--cta-ink)',
              }}
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} aria-hidden="true">
                <rect x="4" y="9" width="12" height="8" rx="1.5" />
                <path d="M7 9V6.5a3 3 0 0 1 6 0V9" strokeLinecap="round" />
              </svg>
              <span>{lang === 'vi' ? 'KHÓA KÝ QUỸ (409)' : 'LOCK ESCROW (409)'}</span>
            </button>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                data-testid="open-vietqr-escrow-btn"
                onClick={() => onOpenDeposit(mappedResidence)}
                className="font-mono-tabular cursor-pointer rounded-sm border px-2 py-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase transition-colors hover:border-[#B48A3E]"
                style={{
                  borderColor: 'var(--border-strong)',
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--text-heading)',
                }}
              >
                {lang === 'vi' ? 'VIETQR KÝ QUỸ' : 'VIETQR HOLD'}
              </button>
              <button
                type="button"
                onClick={() => onBookViewing(mappedResidence)}
                className="font-mono-tabular cursor-pointer rounded-sm border px-2 py-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase transition-colors hover:border-[#B48A3E]"
                style={{
                  borderColor: 'var(--border-subtle)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-heading)',
                }}
              >
                {lang === 'vi' ? 'ĐẶT LỊCH VIP' : 'VIP VIEWING'}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile / Tablet Cleanly Docked Controls & Escrow Telemetry (< lg: ZERO overlap over 3D viewport!) */}
      <div
        className="space-y-3 border-t p-3.5 lg:hidden"
        style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}
      >
        {/* Mobile Sun-Path Scrubber */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono-tabular text-[10px] font-semibold tracking-[0.14em] uppercase" style={{ color: 'var(--accent)' }}>
              SAIGON SUN-PATH · {solarState.clockLabel} ({solarState.elevationDeg.toFixed(0)}°)
            </span>
            <div className="flex items-center gap-1">
              {SUN_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setIsSunPlaying(false);
                    setSolarHour(preset.hour);
                  }}
                  className="font-mono-tabular cursor-pointer rounded-sm border px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    borderColor: Math.abs(solarHour - preset.hour) < 0.35 ? 'var(--accent)' : 'var(--border-subtle)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-heading)',
                  }}
                >
                  {preset.hour === 6 ? '06:00' : preset.hour === 12.5 ? '12:30' : '17:30'}
                </button>
              ))}
            </div>
          </div>
          <input
            type="range"
            min={6}
            max={18.5}
            step={0.25}
            value={solarHour}
            aria-label="Mobile Saigon Sun-Path Hour"
            onChange={(e) => {
              setIsSunPlaying(false);
              setSolarHour(parseFloat(e.target.value));
            }}
            className="kinetix-slider"
          />
        </div>

        {/* Mobile Unit Quick-Pick Strip */}
        <div className="flex flex-wrap gap-1.5">
          {QUICK_UNIT_CODES.map((code) => {
            const u = getSkyTowerUnitByCode(code)!;
            const st = getEffectiveUnitStatus(u, escrowRegistry);
            const pill = statusPillStyle(st);
            const isSelected = code === selectedUnit.unitCode;
            return (
              <button
                key={code}
                type="button"
                onClick={() => handleSelectUnitByCode(code)}
                className="font-mono-tabular inline-flex cursor-pointer items-center gap-1 rounded-sm border px-2 py-1 text-[10px] font-semibold"
                style={{
                  borderColor: isSelected ? 'var(--accent)' : 'var(--border-subtle)',
                  backgroundColor: isSelected ? 'var(--cta-bg)' : 'var(--bg-secondary)',
                  color: isSelected ? 'var(--cta-ink)' : 'var(--text-heading)',
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: pill.dot }} />
                {code}
              </button>
            );
          })}
        </div>

        {/* Mobile Unit Telemetry Card & Escrow CTA */}
        <div
          className="rounded-sm border p-3"
          style={{ borderColor: 'var(--border-strong)', backgroundColor: 'var(--bg-secondary)' }}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-mono-tabular text-base font-bold" style={{ color: 'var(--text-heading)' }}>
                {selectedUnit.unitCode} · F{selectedUnit.story}/{SKY_TOWER_TOTAL_STORIES}
              </div>
              <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                {lang === 'vi' ? selectedUnit.orientationLabelVi : selectedUnit.orientationLabel} ·{' '}
                {selectedUnit.sightlineScore}/100
              </div>
            </div>
            <span
              className="font-mono-tabular rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase"
              style={{
                backgroundColor: activePill.bg,
                borderColor: activePill.border,
                color: activePill.text,
              }}
            >
              {effectiveStatus}
            </span>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <div className="rounded-sm border p-2" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
              <div className="text-[9.5px] uppercase" style={{ color: 'var(--text-muted)' }}>
                {lang === 'vi' ? 'GIÁ' : 'PRICE'}
              </div>
              <div className="font-mono-tabular text-xs font-bold" style={{ color: 'var(--text-heading)' }}>
                {formatCurrency(selectedUnit.priceVnd, currency, lang, { compact: true })}
              </div>
            </div>
            <div className="rounded-sm border p-2" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
              <div className="text-[9.5px] uppercase" style={{ color: 'var(--text-muted)' }}>
                {lang === 'vi' ? 'LỢI SUẤT / CHE BÓNG' : 'YIELD / SHADE'}
              </div>
              <div className="font-mono-tabular text-xs font-bold" style={{ color: 'var(--status-available)' }}>
                {selectedUnit.rentalYieldPct.toFixed(1)}% · {unitSolar.balconyShadePct}%
              </div>
            </div>
          </div>

          {lastLockResult && (
            <div
              className="font-mono-tabular mt-2 rounded-sm border p-2 text-[10px]"
              style={{
                borderColor: lastLockResult.httpStatus === 409 ? 'var(--status-sold-border)' : 'var(--status-available-border)',
                backgroundColor: lastLockResult.httpStatus === 409 ? 'var(--status-sold-bg)' : 'var(--status-available-bg)',
                color: 'var(--text-heading)',
              }}
            >
              HTTP {lastLockResult.httpStatus}: {lang === 'vi' ? lastLockResult.messageVi : lastLockResult.messageEn}
            </div>
          )}

          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleLockEscrow}
              className="font-mono-tabular cursor-pointer rounded-sm px-3 py-2 text-[10.5px] font-semibold uppercase"
              style={{ backgroundColor: 'var(--cta-bg)', color: 'var(--cta-ink)' }}
            >
              LOCK ESCROW (409)
            </button>
            <button
              type="button"
              onClick={() => onOpenDeposit(mappedResidence)}
              className="font-mono-tabular cursor-pointer rounded-sm border px-3 py-2 text-[10.5px] font-semibold uppercase"
              style={{ borderColor: 'var(--border-strong)', backgroundColor: 'var(--accent-soft)', color: 'var(--text-heading)' }}
            >
              VIETQR HOLD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaigonSkyTower3DStage;
