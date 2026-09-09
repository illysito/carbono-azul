const typographyFragment = `
#ifdef GL_ES
precision highp float;
#endif

uniform float u_time;
uniform float u_seed;
uniform float u_cycleTime;
uniform float u_cycleSpeed;
uniform float u_powerFactor;
uniform float u_blueFactor; 
uniform vec2 u_resolution;

varying vec2 v_texcoord;
varying vec3 vPosition;
varying vec3 vColor;

float PI = 3.14159265358979323846;

float rand2(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float hash12(vec2 p)
{
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float rand1(float n){return fract(sin(n) * 43758.5453123);}

//	Simplex 3D Noise 
//	by Ian McEwan, Stefan Gustavson (https://github.com/stegu/webgl-noise)
//
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

// Permutations
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}







void main()
{
  vec2 uv = v_texcoord;

  float random = hash12(0.5 * gl_FragCoord.xy);

  float u_zoom = 2. - 0.05 * u_seed;

  vec4 white = vec4(0.98, 0.98, 0.98, 1.0);
  vec4 black = vec4(0.02, 0.02, 0.02, 1.0);
  vec4 blue = vec4(0.98, 0.98, 0.98, 1.0);
  vec4 green = vec4(0.85, 0.85, 0.15, 1.0);
  vec4 red = vec4(0.7 + 0.16 * sin(2. * u_time), 0.15, 0.15, 1.0);
  float horizontalMixer = smoothstep(0.1, 0.4, u_zoom * uv.x * uv.y) - smoothstep(0.55, 0.95, uv.x);
  float greenMixer = smoothstep(0.48, 0.5, uv.x * uv.y) - smoothstep(0.5, 0.52, uv.x * uv.y);
  vec4 color = mix(white, blue, horizontalMixer) + 1. * mix(black, green, greenMixer);

  color *= 1.0 + 0.6 * random;

  // GREEN

  // color

  vec2 noiseCoords = uv * vec2(4. * uv.x, 4. * uv.y);

  float noiseAmp = 4.0;
  vec2 noiseFreq = 4.2 * vec2(1.8, 2.6);

  // vec3 green = vec3(0.0, 0.8588, 0.2902);
  // vec3 blue = vec3(0.1451, 0.1490, 0.4235 + 0.06 * sin(2. * u_time));
  // vec3 black = vec3(0.02, 0.02, 0.02);

  float n = 0.;
  float initialCenter = 0.4; // (from 1 to 0.72)
  float offsetAmplitude = 0.8; // (from 0.1 to 0.24)
  float center = initialCenter + offsetAmplitude * sin(2. * u_time);
  float thickness = 0.4 + 0.2 * sin(u_time);

  vec4 greenLayer = vec4(0.0, 0.0, 0.0, 1.0);

  for(int i = 0; i < 1; i++){
    n += snoise(vec3(0.4 * noiseFreq * vec2(0.2 * noiseCoords.x + 0.82 * u_time + u_seed, 0.2 * noiseCoords.y - 0.12 * u_time), u_time));
    float lines =
    smoothstep(center - thickness, center, n) -
    smoothstep(center, center + thickness, n);

    // vec3 gradient = mix(black, blue, lines * greenMixer);
    greenLayer = mix(black, green, lines);

  }

  float cycle = fract(u_cycleSpeed * u_time / (u_cycleTime + 0.4 * abs(sin(0.5 * u_time))));
  float phase = 0.3 * sin(cycle * PI);

  float pulse = pow(
    abs(sin(26. * phase * uv.x * uv.y)), 
    24. * u_powerFactor
  );

  gl_FragColor = (color - pulse * greenLayer);
  // gl_FragColor = color + 1. * pulse * greenLayer;
  // gl_FragColor = color + 1. * clamp(pow(sin(2. * u_time), 12.), 0.0, 1.0) * greenLayer;

}
`
export default typographyFragment
