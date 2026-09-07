#version 300 es

/*
Decides the color of each pixel
Basically holds the mtl instructions
Ka, Ambient color (vec3)
Kd, Diffuse color (vec3)
Ks, Specular color (vec3)
Ns, Specular exponent/Shininess (float)
illum, Illumination model (int). Tell which lighting formula to use, like flat or Blinn-Phong.
So I program the different lighting formulas in here.
Texture samplers (sampler2D) to map images.
*/


// Declare that we're using high precision floats
precision highp float;

// Inputs from code
uniform vec3 lightDir;
uniform vec3 cameraEye;
uniform vec3 lightColor;
float lightAtt = 1.0; //This will just be a sun, so att is 1.
uniform vec4 color_Kd;
uniform vec4 color_Ka;
uniform vec4 color_Ks;
//uniform float Kd;
// Hold texture info
uniform sampler2D u_textureSampler; // Holds texture image file pixels
uniform bool u_useTexture;          // True if texture provided, false if not.

// Declare variables coming in from vertex shader
in vec4 vnormal;
//in vec3 vnormal;
in vec2 vuv;

// Declare intermediate variables used here for calcs
vec3 baseColor; // For textures. Use this if texture not provided
vec4 kdTotal;
vec4 kaTotal;
vec4 ksTotal;
vec3 IDiffuse_3D;
vec3 IAmbient_3D;
vec3 ISpecular_3D;
vec4 IDiffuse;
vec4 IAmbient;
vec4 ISpecular;

// Declare output
out vec4 fragColor;

void main() {
    // Handle texture if provided
    float color_KdAlpha = color_Kd.a;
    // TODO Handle maps in Ka, Ks space too
    //float color_KaAlpha = color_Ka.a;
    //float color_KsAlpha = color_Ks.a;
    if (u_useTexture) {
        vec4 texel = texture(u_textureSampler, vuv);
        baseColor = texel.rgb;
        color_KdAlpha = texel.a; // Keep the texture's alpha channel
    } else {
        baseColor = color_Kd.rgb; // Original color supplied to fragment shader
    }
    /* Lambertian lighting */ //TODO Introduce Blinn-Phong lighting that looks Lambertian if Ka, Ks defaults.
    kdTotal = vec4(baseColor.xyz, color_KdAlpha); // Kd * color;
    IDiffuse_3D = (kdTotal.xyz * lightColor) * max(0.0, dot(normalize(vnormal.xyz), normalize(lightDir))) * lightAtt;
    IDiffuse = vec4(IDiffuse_3D, color_KdAlpha);

    fragColor = IDiffuse;

}