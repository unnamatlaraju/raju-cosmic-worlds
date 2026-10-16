export const noiseGLSL = /* glsl */ `
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float value = 0.0, amplitude = 0.5;
    mat2 turn = mat2(0.8, -0.6, 0.6, 0.8);
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p = turn * p * 2.03 + 5.7;
      amplitude *= 0.5;
    }
    return value;
  }
`

// Seamless object-space detail: no longitude seam or stretched poles.
const volumeNoiseGLSL = /* glsl */ `
  float hash3(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.17, 0.31, 0.43));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise3(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x),
                   mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x),
                   mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm3(vec3 p) {
    float n = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) {
      n += a * noise3(p);
      p = p * 2.03 + vec3(5.1, 1.7, 9.2);
      a *= 0.5;
    }
    return n;
  }
  float ridged3(vec3 p) {
    float n = 0.0, a = 0.5;
    for (int i = 0; i < 3; i++) {
      n += a * (1.0 - abs(noise3(p) * 2.0 - 1.0));
      p = p * 2.11 + vec3(3.2, 8.4, 1.6);
      a *= 0.52;
    }
    return n;
  }
`

export const screenVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }
`

export const nebulaFragment = /* glsl */ `
  uniform float uTime, uAspect, uTravel, uPortrait, uFlightSpeed;
  uniform vec2 uPointer;
  varying vec2 vUv;
  ${noiseGLSL}
  void main() {
    vec2 uv = vUv;
    vec2 center = mix(vec2(0.73, 0.53), vec2(0.60, 0.67), uPortrait);
    vec2 p = (uv - center) * vec2(uAspect, 1.0) * 2.4;
    float t = uTime * (0.005 + uFlightSpeed * 0.035);
    // Different parallax and travel scales give the cloud strata their own depth.
    vec2 farP = p * (1.0 - uTravel * 0.08) + uPointer * 0.018 + vec2(t * uFlightSpeed * 0.22, 0.0);
    vec2 midP = p * (1.0 - uTravel * 0.19) + uPointer * 0.050 + vec2(t * uFlightSpeed * 0.50, 0.0);
    vec2 nearP = p * (1.0 - uTravel * 0.31) + uPointer * 0.088 + vec2(t * uFlightSpeed * 0.95, 0.0);
    float farCloud = fbm(farP * 1.45 + vec2(t * 0.72, -t * 0.55));
    float farBillow = 1.0 - abs(farCloud * 2.0 - 1.0);
    vec2 warp = vec2(fbm(midP * 1.9 + t), fbm(midP * 2.2 + 11.4 - t * 0.8));
    float midCloud = fbm(midP * 3.45 + warp * 2.8);
    float fine = fbm(nearP * 8.5 + warp * 3.3 + vec2(t * 0.32, -t * 0.18));
    float ridges = 1.0 - abs(fbm(nearP * 5.0 + warp) * 2.0 - 1.0);
    float diagonal = midP.y - midP.x * 0.64;
    float ribbon = exp(-pow((diagonal + 0.10 + (midCloud - 0.5) * 0.92) * 2.65, 2.0));
    float branching = smoothstep(0.34, 0.72, midCloud + ridges * 0.18 + farBillow * 0.10);
    float pocket = 1.0 - exp(-length(midP * vec2(0.92, 1.22)) * 1.9);
    float density = ribbon * branching * (0.2 + pocket * 0.8);
    float filaments = pow(max(fine - 0.35, 0.0), 2.1) * ribbon * (0.55 + ridges * 0.7);
    float darkChannel = smoothstep(0.34, 0.58, 1.0 - midCloud) * ribbon;
    float dustLane = smoothstep(0.46, 0.74, 1.0 - fine) * smoothstep(0.26, 0.78, midCloud) * ribbon;
    float voids = smoothstep(0.42, 0.67, 1.0 - farCloud) * (0.42 + pocket * 0.58);
    float blueFilaments = pow(max(ridges - 0.38, 0.0), 2.0) * smoothstep(0.34, 0.77, fine) * ribbon;
    float hotKnots = smoothstep(0.70, 0.94, fine) * smoothstep(0.45, 0.78, midCloud) * ribbon;
    float farVeil = exp(-dot(farP * vec2(0.72, 0.9), farP) * 0.42) * smoothstep(0.32, 0.68, farCloud);
    vec3 color = vec3(0.009, 0.013, 0.032);
    color += vec3(0.025, 0.048, 0.14) * farVeil * 1.35;
    color += vec3(0.13, 0.035, 0.27) * density * 1.12;
    color += vec3(0.34, 0.075, 0.54) * filaments * 1.52;
    color += vec3(0.035, 0.15, 0.34) * smoothstep(0.48, 0.82, farCloud) * ribbon * 0.78;
    color += vec3(0.12, 0.24, 0.54) * blueFilaments * 0.58;
    color += vec3(0.56, 0.11, 0.38) * hotKnots * 0.66;
    color *= 1.0 - darkChannel * 0.57 - dustLane * 0.22;
    color *= 1.0 - voids * 0.25;
    // Localized ionized pockets keep the cloud luminous without washing the whole frame.
    float bluePocket = exp(-length(midP - vec2(0.42, 0.12)) * 3.2) * smoothstep(0.35, 0.78, farCloud);
    float violetPocket = exp(-length(midP - vec2(-0.28, -0.38)) * 4.6) * density;
    color += vec3(0.045, 0.22, 0.48) * bluePocket;
    color += vec3(0.37, 0.10, 0.60) * violetPocket;
    float desktopShade = mix(0.22, 1.0, smoothstep(0.23, 0.66, uv.x));
    float portraitShade = mix(0.19, 1.0, smoothstep(0.25, 0.58, uv.y));
    color *= mix(desktopShade, portraitShade, uPortrait);
    color *= 0.8 + 0.2 * (1.0 - smoothstep(0.3, 0.8, length(uv - 0.5)));
    color += (hash(gl_FragCoord.xy) - 0.5) * 0.003;
    gl_FragColor = vec4(color, 1.0);
  }
`

export const starVertex = /* glsl */ `
  attribute float aSize, aPhase, aBrightness;
  attribute vec3 aColor;
  uniform float uTime, uPixelRatio, uAspect, uLayer, uSpeed;
  uniform vec2 uPointer;
  varying vec3 vColor;
  varying float vAlpha, vLayer, vBrightness, vFlightSpeed;
  void main() {
    float depth = 22.0 - position.z;
    float layerT = uLayer / 2.0;
    float drift = uTime * mix(0.00035, 0.0035, layerT) * (1.0 + uSpeed * 0.14);
    vec2 seed = position.xy;
    // Slow directional drift is wrapped in the stellar plane so it never reveals an edge.
    seed.x = mod(seed.x + drift + 1.15, 2.3) - 1.15;
    seed.y += sin(uTime * (0.0018 + uLayer * 0.0012) + aPhase * 1.7) * (0.003 + layerT * 0.006);
    // Radial forward slipstream expansion during interplanetary cruise
    seed *= 1.0 + uSpeed * (0.035 + layerT * 0.13);
    vec3 p = vec3(seed * depth * 0.383864 * vec2(uAspect, 1.0), position.z);
    p.xy += uPointer * (0.12 + uLayer * 0.15);
    vec4 view = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * view;
    float perspective = clamp(pow(depth / max(-view.z, 1.0), 0.55), 0.7, 2.8);
    gl_PointSize = min(aSize * uPixelRatio * perspective * (1.0 + uSpeed * (0.12 + uLayer * 0.22)), 24.0 * uPixelRatio);
    vColor = aColor;
    vLayer = uLayer;
    vBrightness = aBrightness;
    vFlightSpeed = uSpeed;
    float twinkle = sin(uTime * (0.18 + fract(aPhase) * 0.46) + aPhase) * (0.035 + aBrightness * 0.045);
    vAlpha = aBrightness * (0.62 + uLayer * 0.14 + twinkle) * smoothstep(0.8, 3.0, -view.z);
  }
`

export const starFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha, vLayer, vBrightness, vFlightSpeed;
  void main() {
    vec2 p = (gl_PointCoord - 0.5) * 2.0;
    float r = length(p);
    float disc = 1.0 - smoothstep(0.72, 1.0, r);
    float core = exp(-r * r * (vLayer < 0.5 ? 22.0 : 31.0));
    float halo = exp(-r * r * (vLayer < 1.5 ? 7.0 : 4.2)) * (0.08 + vBrightness * 0.11);
    float rays = (exp(-abs(p.x) * 78.0) + exp(-abs(p.y) * 78.0)) * exp(-r * 4.8) * vBrightness * 0.22;
    float streak = exp(-abs(p.y) * (20.0 - vFlightSpeed * 13.5)) * exp(-abs(p.x) * 1.9) * vFlightSpeed * (0.28 + vBrightness * 0.42);
    float light = vLayer < 0.5 ? disc * 0.75 + core * 0.25 + streak * 0.45 : core + halo + rays * step(1.5, vLayer) + streak;
    gl_FragColor = vec4(vColor * (0.82 + vBrightness * 0.34), light * vAlpha * disc);
  }
`

export const planetVertex = /* glsl */ `
  varying vec3 vNormal, vWorldPosition, vLocalPosition;
  void main() {
    vLocalPosition = position;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

// Shared optical density: the same divisions shade both the disk and its shadow on the planet.
const ringProfileGLSL = /* glsl */ `
  float ringZone(float r, float inner, float outer, float feather) {
    return smoothstep(inner, inner + feather, r) * (1.0 - smoothstep(outer - feather, outer, r));
  }
  float ringDensity(float r) {
    float density = 0.24 * ringZone(r, 1.16, 1.49, 0.06);
    density += 0.93 * ringZone(r, 1.43, 1.91, 0.025);
    density += 0.72 * ringZone(r, 1.985, 2.33, 0.028);
    density += 0.48 * ringZone(r, 2.35, 2.38, 0.008);
    density *= mix(0.14, 1.0, smoothstep(0.006, 0.015, abs(r - 2.205)));
    return density;
  }
  float sphereShadow(vec3 offset, vec3 light, float radius) {
    float along = dot(offset, light);
    float distanceToRay = length(offset - light * along) / radius;
    return along < 0.0 ? smoothstep(0.94, 1.055, distanceToRay) : 1.0;
  }
`

export const gasGiantFragment = /* glsl */ `
  varying vec3 vNormal, vWorldPosition, vLocalPosition;
  uniform vec3 uLight, uPlanetCenter, uRingNormal;
  uniform float uTime, uFocus, uPlanetRadius;
  ${noiseGLSL}
  ${volumeNoiseGLSL}
  ${ringProfileGLSL}

  // A spherical tangent-space vortex bends the belts without a longitude seam.
  vec3 vortex(vec3 p, vec3 center, vec2 extent, float strength) {
    vec3 east = normalize(vec3(center.z, 0.0, -center.x));
    vec3 north = cross(center, east);
    vec2 q = vec2(dot(p, east), dot(p, north));
    vec2 ellipse = q / extent;
    float falloff = exp(-dot(ellipse, ellipse) * 1.6) * smoothstep(0.7, 0.95, dot(p, center));
    float angle = strength * falloff;
    vec2 twisted = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * ellipse;
    vec2 shift = (twisted - ellipse) * extent;
    return normalize(p + east * shift.x + north * shift.y);
  }

  void main() {
    vec3 p = normalize(vLocalPosition);
    vec3 stormCenter = normalize(vec3(0.38, -0.26, 0.89));
    p = vortex(p, stormCenter, vec2(0.22, 0.068), 2.5);
    p = vortex(p, normalize(vec3(-0.68, 0.39, 0.62)), vec2(0.14, 0.04), -1.8);

    // Longitude detail is stretched along the jets; small latitude warps replace the
    // old high-amplitude sine pattern that made the whole sphere look like tiger stripes.
    float latitude = asin(clamp(p.y, -1.0, 1.0));
    vec3 flow = vec3(p.x * 5.0, p.y * 24.0, p.z * 5.0);
    flow += vec3(uTime * 0.003, 0.0, -uTime * 0.002);
    float eddies = fbm3(flow);
    float detail = fbm3(flow * 3.3 + eddies * 1.4);
    float polarFade = 1.0 - smoothstep(0.82, 0.99, abs(p.y));
    float lat = latitude + ((eddies - 0.5) * 0.042 + (detail - 0.5) * 0.014) * polarFade;
    float wide = noise(vec2(lat * 8.7 + 12.3, 3.6));
    float belts = noise(vec2(lat * 24.0 + 6.2, 8.1));
    float filaments = noise(vec2(lat * 115.0 + detail * 0.85, 2.3));
    float micro = sin(lat * 310.0 + eddies * 7.0);

    vec3 copper = vec3(0.39, 0.19, 0.105);
    vec3 gold = vec3(0.72, 0.46, 0.24);
    vec3 ivory = vec3(0.91, 0.77, 0.57);
    vec3 lavender = vec3(0.38, 0.28, 0.43);
    float tone = wide * 0.45 + belts * 0.55;
    vec3 albedo = mix(copper, gold, smoothstep(0.20, 0.59, tone));
    albedo = mix(albedo, ivory, smoothstep(0.51, 0.77, tone));
    float violetBelt = exp(-pow((lat + 0.29) / 0.105, 2.0)) + exp(-pow((lat - 0.53) / 0.12, 2.0)) * 0.7;
    albedo = mix(albedo, lavender, violetBelt * (0.38 + belts * 0.30));
    albedo = mix(albedo, ivory, smoothstep(0.63, 0.87, filaments) * 0.42);
    albedo *= 0.87 + detail * 0.20 + (filaments - 0.5) * 0.13 + micro * 0.022;

    vec3 n = normalize(vNormal);
    vec3 eye = normalize(cameraPosition - vWorldPosition);
    vec3 light = normalize(uLight);
    float ndl = dot(n, light);
    float day = smoothstep(-0.13, 0.20, ndl);
    float diffuse = day * (0.07 + 0.93 * pow(max(ndl, 0.0), 0.8));

    // Ray/plane intersection gives the rings a matching shadow across the atmosphere.
    vec3 offset = (vWorldPosition - uPlanetCenter) / uPlanetRadius;
    float denominator = dot(light, uRingNormal);
    float safeDenominator = abs(denominator) < 0.001 ? 0.001 : denominator;
    float rayDistance = -dot(offset, uRingNormal) / safeDenominator;
    float hitRadius = length(offset + light * rayDistance);
    float shadow = rayDistance > 0.0 ? 1.0 - ringDensity(hitRadius) * 0.48 : 1.0;
    vec3 color = albedo * (vec3(0.026, 0.027, 0.045) + vec3(1.16, 1.06, 0.94) * diffuse * shadow);
    float limb = pow(1.0 - max(dot(n, eye), 0.0), 4.5);
    color += vec3(0.15, 0.18, 0.45) * limb * (0.035 + day * 0.30 + uFocus * 0.08);
    float scattering = pow(max(dot(normalize(eye + light), n), 0.0), 22.0) * diffuse;
    color += vec3(1.0, 0.76, 0.47) * scattering * 0.024;
    gl_FragColor = vec4(color, 1.0);
  }
`

export const planetFragment = /* glsl */ `
  varying vec3 vNormal, vWorldPosition, vLocalPosition;
  uniform vec3 uLight, uBase, uHigh;
  uniform float uRock, uFocus, uTime;
  ${volumeNoiseGLSL}
  void main() {
    vec3 p = normalize(vLocalPosition);
    vec3 flow = p + vec3(uTime * 0.0022, -uTime * 0.0011, uTime * 0.0017);
    float macro = fbm3(flow * 3.1);
    float turbulence = fbm3(flow * 8.2 + vec3(3.0, 1.0, 7.0));
    float grain = ridged3(flow * 24.0 + turbulence * 2.4);

    // Latitude is evaluated from the sphere itself, so the bands remain seamless at the poles.
    float latitude = asin(clamp(p.y, -1.0, 1.0));
    float warpedLatitude = latitude + (macro - 0.5) * 0.23 + (turbulence - 0.5) * 0.065;
    float bandWave = sin(warpedLatitude * 18.0 + macro * 4.3 + sin(latitude * 7.0) * 0.72);
    float bandLight = bandWave * 0.5 + 0.5;
    float cloudLight = clamp(bandLight + (turbulence - 0.5) * 0.24, 0.0, 1.0);

    vec3 umber = vec3(0.16, 0.085, 0.075);
    vec3 copper = vec3(0.53, 0.255, 0.16);
    vec3 champagne = vec3(0.88, 0.57, 0.29);
    vec3 ivory = vec3(1.02, 0.83, 0.59);
    vec3 lavender = vec3(0.49, 0.33, 0.53);
    vec3 violet = vec3(0.17, 0.075, 0.20);
    vec3 warm = mix(umber, copper, smoothstep(0.12, 0.34, cloudLight));
    warm = mix(warm, champagne, smoothstep(0.30, 0.53, cloudLight));
    warm = mix(warm, ivory, smoothstep(0.50, 0.73, cloudLight));
    warm = mix(warm, lavender, smoothstep(0.72, 0.92, turbulence) * 0.65);
    warm = mix(warm, violet, smoothstep(0.02, 0.22, 1.0 - cloudLight) * 0.42);

    float darkLane = smoothstep(0.18, 0.42, 1.0 - bandLight) * (0.58 + turbulence * 0.42);
    float cloudLace = smoothstep(0.62, 0.91, grain) * (0.45 + bandLight * 0.55);
    float storm = smoothstep(0.70, 0.94, turbulence) * smoothstep(0.46, 0.76, bandLight);
    vec3 albedo = mix(warm, warm * vec3(0.28, 0.19, 0.35), darkLane * 0.48);
    albedo += mix(vec3(0.05, 0.03, 0.06), vec3(0.24, 0.13, 0.08), bandLight) * cloudLace * 0.22;
    albedo = mix(albedo, mix(ivory, copper, turbulence), storm * 0.2);
    albedo = mix(albedo, mix(uBase, uHigh, turbulence), uRock);
    albedo *= 0.78 + grain * 0.32;

    // A tiny normal perturbation from seamless detail keeps the silhouette smooth.
    vec3 n = normalize(vNormal + (grain - 0.5) * vNormal * 0.045);
    vec3 eye = normalize(cameraPosition - vWorldPosition);
    vec3 lightDirection = normalize(uLight);
    float ndl = dot(n, lightDirection);
    float day = smoothstep(-0.18, 0.26, ndl);
    float diffuse = day * (0.16 + 0.84 * sqrt(max(ndl, 0.0)));
    float bounce = max(dot(n, normalize(vec3(0.72, -0.28, 0.2))), 0.0);
    vec3 color = albedo * (0.022 + diffuse * 1.28);
    color += vec3(0.035, 0.052, 0.12) * bounce * (1.0 - day) * 0.58;
    float specular = pow(max(dot(reflect(-lightDirection, n), eye), 0.0), 32.0) * day;
    color += vec3(1.0, 0.67, 0.36) * specular * (0.07 + cloudLace * 0.12);
    float rim = pow(1.0 - max(dot(n, eye), 0.0), 3.8);
    color += mix(vec3(0.29, 0.39, 0.76), uHigh, uRock) * rim * (0.22 + day * 0.34 + uFocus * 0.18);
    gl_FragColor = vec4(color, 1.0);
  }
`

export const rockyBodyFragment = /* glsl */ `
  varying vec3 vNormal, vWorldPosition, vLocalPosition;
  uniform vec3 uLight, uBase, uHigh;
  uniform float uSeed, uTime;
  ${volumeNoiseGLSL}
  void main() {
    vec3 p = normalize(vLocalPosition);
    vec3 flow = p * 3.2 + vec3(uSeed * 3.7, uSeed * 1.9, -uSeed * 2.8);
    float continents = fbm3(flow);
    float ridges = ridged3(p * (8.5 + uSeed * 1.5) + vec3(uTime * 0.0007, 0.0, -uTime * 0.0005));
    float fine = ridged3(p * 24.0 + continents * 3.0 + uSeed);
    float craterRims = smoothstep(0.54, 0.88, ridges) * (0.45 + fine * 0.55);
    float channels = smoothstep(0.58, 0.88, continents) * smoothstep(0.40, 0.80, fine);
    vec3 albedo = mix(uBase, uHigh, smoothstep(0.22, 0.82, continents));
    albedo *= 0.70 + ridges * 0.28;
    albedo += vec3(0.13, 0.09, 0.07) * craterRims;
    albedo -= vec3(0.08, 0.04, 0.035) * channels;

    vec3 n = normalize(vNormal + (fine - 0.5) * vNormal * 0.13);
    vec3 eye = normalize(cameraPosition - vWorldPosition);
    vec3 light = normalize(uLight);
    float ndl = dot(n, light);
    float day = smoothstep(-0.24, 0.22, ndl);
    float diffuse = day * (0.12 + 0.88 * pow(max(ndl, 0.0), 0.72));
    float nightBounce = max(dot(n, normalize(vec3(0.35, -0.4, 0.7))), 0.0);
    vec3 color = albedo * (vec3(0.025, 0.028, 0.045) + diffuse * 1.12);
    color += vec3(0.035, 0.06, 0.13) * nightBounce * (1.0 - day) * 0.55;
    float rim = pow(1.0 - max(dot(n, eye), 0.0), 3.0);
    color += vec3(0.16, 0.24, 0.47) * rim * (0.10 + day * 0.24);
    gl_FragColor = vec4(color, 1.0);
  }
`

export const atmosphereFragment = /* glsl */ `
  varying vec3 vNormal, vWorldPosition, vLocalPosition;
  uniform vec3 uLight;
  uniform float uFocus;
  void main() {
    vec3 n = normalize(vNormal);
    vec3 eye = normalize(cameraPosition - vWorldPosition);
    float rim = pow(1.0 - max(dot(n, eye), 0.0), 3.1);
    float light = smoothstep(-0.25, 0.85, dot(n, normalize(uLight)));
    float backGlow = pow(1.0 - abs(dot(n, eye)), 2.2) * (1.0 - light * 0.35);
    gl_FragColor = vec4(0.32, 0.43, 0.92, rim * (light * 0.17 + backGlow * 0.11 + uFocus * 0.08));
  }
`

export const ringFragment = /* glsl */ `
  varying vec3 vLocalPosition, vWorldPosition, vNormal;
  uniform vec3 uPlanetCenter, uLight, uRingNormal;
  uniform float uPlanetRadius, uTime;
  ${noiseGLSL}
  ${ringProfileGLSL}
  void main() {
    float r = length(vLocalPosition.xy);
    float radial = clamp((r - 1.12) / 1.25, 0.0, 1.0);
    float angle = atan(vLocalPosition.y, vLocalPosition.x);
    float dust = noise(vec2(r * 87.0 + cos(angle * 3.0) * 2.4, 7.2 + sin(angle * 2.0))) * 0.55
      + noise(vec2(r * 31.0 + sin(angle * 7.0) * 1.8, 3.1)) * 0.45;
    float movingDust = noise(vec2(r * 470.0 + cos(angle + uTime * 0.018) * 5.0, angle * 9.0 + uTime * 0.012));
    float fine = noise(vec2(r * 470.0, movingDust * 4.0 + 9.4));
    float broad = 0.5 + 0.5 * sin(r * 43.0 + dust * 4.4 + angle * 0.7 + uTime * 0.010);
    float fineBands = 0.5 + 0.5 * sin(r * 275.0 + dust * 11.0 + sin(r * 19.0) + angle * 2.8 + uTime * 0.022);
    float edge = smoothstep(1.12, 1.22, r) * (1.0 - smoothstep(2.25, 2.38, r));
    float gap = 1.0 - smoothstep(0.010, 0.028, abs(r - 1.47)) * 0.94;
    gap *= 1.0 - smoothstep(0.013, 0.035, abs(r - 1.68)) * 0.97;
    gap *= 1.0 - smoothstep(0.009, 0.026, abs(r - 1.92)) * 0.90;
    float lane = ringDensity(r) * (0.34 + broad * 0.38 + fineBands * 0.56);
    vec3 oc = vWorldPosition - uPlanetCenter;
    float alongLight = dot(oc, uLight);
    float shadowDistance = length(oc - uLight * alongLight) / uPlanetRadius;
    float shadow = alongLight < 0.0 ? smoothstep(0.89, 1.07, shadowDistance) : 1.0;
    float light = 0.42 + max(dot(normalize(vNormal), normalize(uLight)), 0.0) * 0.58;
    vec3 dark = vec3(0.11, 0.055, 0.15);
    vec3 bronze = vec3(0.72, 0.34, 0.16);
    vec3 ivory = vec3(1.04, 0.79, 0.45);
    vec3 lilac = vec3(0.54, 0.34, 0.62);
    vec3 color = mix(dark, lilac, smoothstep(0.12, 0.44, dust));
    color = mix(color, bronze, smoothstep(0.34, 0.68, broad) * 0.78);
    color = mix(color, ivory, smoothstep(0.68, 0.96, fineBands) * 0.72);
    float glint = smoothstep(0.72, 0.98, movingDust) * smoothstep(0.40, 0.92, fineBands);
    color *= light * (0.28 + shadow * 1.18) + vec3(1.0, 0.46, 0.18) * glint * 0.16;
    float alpha = edge * gap * lane * (0.58 + dust * 0.46 + fine * 0.34) * (0.72 + radial * 0.58);
    gl_FragColor = vec4(color, alpha);
  }
`

export const sunVertex = /* glsl */ `
  attribute float aSize;
  uniform float uPixelRatio;
  void main() {
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * view;
    gl_PointSize = aSize * uPixelRatio * (100.0 / max(-view.z, 1.0));
  }
`

export const sunFragment = /* glsl */ `
  uniform float uTime;
  void main() {
    vec2 p = (gl_PointCoord - 0.5) * 2.0;
    float r = length(p);
    float core = exp(-r * r * 15.0);
    float glow = exp(-r * r * 2.25);
    float rays = (exp(-abs(p.x) * 30.0) + exp(-abs(p.y) * 30.0)) * exp(-r * 3.0) * 0.22;
    float longRay = (exp(-abs(p.x + p.y) * 23.0) + exp(-abs(p.x - p.y) * 23.0)) * exp(-r * 4.0) * 0.08;
    float pulse = 0.96 + sin(uTime * 0.32) * 0.025;
    vec3 color = vec3(1.0, 0.55, 0.19) * (glow * 0.42 + rays + longRay) + vec3(1.0, 0.93, 0.66) * core * 1.6;
    float alpha = min(1.0, (glow * 0.25 + core * 0.9 + rays + longRay) * pulse);
    gl_FragColor = vec4(color, alpha * (1.0 - smoothstep(0.92, 1.0, r)));
  }
`

export const galaxyPlaneVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const galaxyPlaneFragment = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 q = (vUv - 0.5) * 2.0;
    q.x *= 1.26;
    float r = length(q);
    float a = atan(q.y, q.x) + uTime * 0.002;
    float disk = exp(-r * 1.72) * smoothstep(1.16, 0.04, r);
    float spiral = a * 2.0 - r * 8.4;
    float armsA = pow(max(0.0, 0.5 + 0.5 * cos(spiral)), 8.0);
    float armsB = pow(max(0.0, 0.5 + 0.5 * cos(spiral + 3.14159)), 8.0);
    float arms = (armsA + armsB) * disk * smoothstep(0.10, 0.38, r);
    float outerDust = smoothstep(0.22, 0.75, r) * (1.0 - smoothstep(0.78, 1.06, r));
    float dustLane = smoothstep(0.14, 0.46, r) * (1.0 - smoothstep(0.53, 0.88, r));
    float core = exp(-r * r * 10.5);
    float coreHalo = exp(-r * 3.4);
    vec3 color = vec3(0.055, 0.09, 0.28) * disk * 0.42;
    color += vec3(0.14, 0.14, 0.54) * arms * 1.32;
    color += vec3(0.15, 0.23, 0.60) * outerDust * disk * 0.24;
    color += vec3(0.62, 0.34, 0.70) * coreHalo * 0.09;
    color += vec3(1.0, 0.78, 0.54) * core * 0.74;
    color *= 1.0 - dustLane * 0.42;
    float alpha = (disk * 0.10 + arms * 0.62 + outerDust * disk * 0.06 + coreHalo * 0.045 + core * 0.52) * smoothstep(1.0, 0.08, r);
    gl_FragColor = vec4(color, alpha);
  }
`

export const galaxyPointVertex = /* glsl */ `
  attribute float aSize, aAlpha, aPhase;
  attribute vec3 aColor;
  uniform float uPixelRatio, uTime;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float radius = length(position.xy);
    float angle = uTime * 0.0009 * (1.0 - radius * 0.025) + aPhase * 0.0007;
    vec2 rotated = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * position.xy;
    vec4 view = modelViewMatrix * vec4(rotated, position.z, 1.0);
    gl_Position = projectionMatrix * view;
    gl_PointSize = aSize * uPixelRatio * (88.0 / max(-view.z, 1.0));
    vColor = aColor;
    vAlpha = aAlpha;
  }
`

export const galaxyPointFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 p = (gl_PointCoord - 0.5) * 2.0;
    float r = length(p);
    float halo = exp(-r * r * 3.6);
    float core = exp(-r * r * 14.0);
    gl_FragColor = vec4(vColor * (halo * 0.34 + core * 0.58), vAlpha * halo * 0.72 * (1.0 - smoothstep(0.84, 1.0, r)));
  }
`
