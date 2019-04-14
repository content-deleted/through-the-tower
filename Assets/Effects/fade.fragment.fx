#ifdef GL_ES
    precision highp float;
#endif

// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;

// Parameters
uniform float Fade;

void main(void) 
{
    vec4 baseColor = texture2D(textureSampler, vUV);
    baseColor *= Fade;
    baseColor.a = 1.0;
    gl_FragColor = baseColor; 
}