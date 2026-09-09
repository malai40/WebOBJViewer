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
uniform vec3 color_Ka;
uniform vec3 color_Ks;
//uniform float Kd;
uniform float Ns; // Shine factor for highlights
// Hold texture info
uniform sampler2D u_textureSampler; // Holds texture image file pixels
uniform bool u_useTexture;          // True if texture provided, false if not.

// Declare variables coming in from vertex shader
in vec4 vnormal;
//in vec3 vnormal;
in vec2 vuv;
in vec4 vposition;

// Declare intermediate variables used here for calcs
vec3 baseColor; // For textures. Use this if texture not provided
vec4 kdTotal;
vec3 kaTotal;
vec3 ksTotal;
vec3 IDiffuse_3D;
vec3 IAmbient_3D;
vec3 ISpecular_3D;
vec4 IDiffuse;
vec3 IAmbient;
vec3 ISpecular;
vec3 viewVec;
vec3 reflectVec;

// Declare output
out vec4 fragColor;

void main() {
    // Handle texture if provided
    float color_KdAlpha = color_Kd.a;
    // TODO Handle maps in Ka, Ks space too
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

    kaTotal = color_Ka; //vec4(color_Ka.xyz, color_KdAlpha);
    IAmbient_3D = (kaTotal.xyz * vec3(0.1, 0.1, 0.1));
    IAmbient = IAmbient_3D;

    viewVec = normalize(cameraEye - vposition.xyz);
    //viewVec = vec3(0.0, 0.0, 1.0);
    reflectVec = normalize(2.0 * dot(vnormal.xyz, lightDir) * vnormal.xyz - lightDir);
    ksTotal = color_Ks;
    // Changed from 0.0 to 0.0001 to prevent pow(0,0) which causes unintentional black shadow
    ISpecular_3D = ksTotal * pow(max(0.0001, dot(reflectVec, viewVec)), Ns);
    ISpecular = ISpecular_3D;
    //ISpecular = vec3(0.0, 0.0, 0.0);

    fragColor = vec4(IDiffuse.xyz + IAmbient + ISpecular, IDiffuse.a);

}