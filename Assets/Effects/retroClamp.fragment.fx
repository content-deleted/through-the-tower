#ifdef GL_ES
    precision highp float;
#endif

// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;

// Parameters
uniform vec2 screenSize;
uniform float colorPrecision;
uniform sampler2D pallete;

void main(void) 
{
    //texelSize = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);
    vec4 baseColor = texture2D(textureSampler, vUV);
    baseColor *= 5.0;
	baseColor = floor(baseColor);
    baseColor /= 5.0;

    vec4 col = baseColor;
    
    baseColor = texture2D(pallete, vec2((col.x+col.y+col.z)/3.0, 0.1)); 
    
    gl_FragColor = baseColor; 
}