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
uniform sampler2D u_textureSampler_Ka; // Holds texture image file pixels
uniform sampler2D u_textureSampler_Ks; // Holds texture image file pixels
uniform sampler2D u_textureSampler_d; // Holds texture image file pixels

uniform bool u_useTexture;          // True if texture provided, false if not.
uniform bool u_useTexture_Ka;          // True if texture provided, false if not.
uniform bool u_useTexture_Ks;          // True if texture provided, false if not.
uniform bool u_useTexture_d;          // True if texture provided, false if not.

uniform vec3 s_Kd; // Holds scaling info for map_Kd
uniform vec3 s_Ka; // Holds scaling info for map_Ka
uniform vec3 s_Ks; // Holds scaling info for map_Ks
uniform vec3 s_d; // Holds scaling info for map_Ks


// Declare variables coming in from vertex shader
in vec4 vnormal;
//in vec3 vnormal;
in vec2 vuv;
in vec4 vposition;

// Declare intermediate variables used here for calcs
vec3 baseColor; // For textures. Use this if texture not provided
vec3 baseColor_a; // For textures. Use this if texture not provided
vec3 baseColor_s; // For textures. Use this if texture not provided
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
    // Handle texture if provided (Kd)
    float color_KdAlpha = color_Kd.a;
    // TODO Handle maps in Ka, Ks space too
    if (u_useTexture) {
        vec4 texel_d = texture(u_textureSampler, vuv * s_Kd.st);
        //vec4 texel_d = texture(u_textureSampler, vuv);
        baseColor = texel_d.rgb;
        color_KdAlpha = texel_d.a; // Keep the texture's alpha channel
        //color_KdAlpha = color_KdAlpha * texel_d.a; // Keep the texture's alpha channel
    } else {
        baseColor = color_Kd.rgb; // Original color supplied to fragment shader
    }

    /*
    if (u_useTexture_d) {
        vec4 texel_dd = texture(u_textureSampler_d, vuv * s_d.st);
        //vec4 texel_d = texture(u_textureSampler, vuv);
        //baseColor = texel_dd.rgb;
        color_KdAlpha = color_KdAlpha * texel_dd.a; // Keep the texture's alpha channel
    }
    */

    /* Lambertian lighting */ //TODO Introduce Blinn-Phong lighting that looks Lambertian if Ka, Ks defaults.
    kdTotal = vec4(baseColor.rgb, color_KdAlpha); // Kd * color;
    IDiffuse_3D = (kdTotal.rgb * lightColor) * max(0.0, dot(normalize(vnormal.xyz), normalize(lightDir))) * lightAtt;
    IDiffuse = vec4(IDiffuse_3D, color_KdAlpha);


    // Handle texture if provided (Ka)
    //float color_KdAlpha = color_Kd.a;
    // TODO Handle maps in Ka, Ks space too
    if (u_useTexture_Ka) {
        //vec4 texel_a = texture(u_textureSampler_Ka, vuv);
        vec4 texel_a = texture(u_textureSampler_Ka, vuv * s_Ka.st);
        baseColor_a = texel_a.rgb;
        //color_KdAlpha = texel.a; // Keep the texture's alpha channel
    } else {
        baseColor_a = color_Ka; // Original color supplied to fragment shader
    }
    /* Ambient lighting */
    kaTotal = baseColor_a; //vec4(color_Ka.xyz, color_KdAlpha);
    IAmbient_3D = (kaTotal.rgb * vec3(0.1, 0.1, 0.1));
    IAmbient = IAmbient_3D;

    // Handle texture if provided (Ks)
    //float color_KdAlpha = color_Kd.a;
    // TODO Handle maps in Ka, Ks space too
    if (u_useTexture_Ks) {
        vec4 texel_s = texture(u_textureSampler_Ks, vuv * s_Ks.st);
        baseColor_s = texel_s.rgb;
        //color_KdAlpha = texel.a; // Keep the texture's alpha channel
    } else {
        baseColor_s = color_Ks; // Original color supplied to fragment shader
    }

    viewVec = normalize(cameraEye - vposition.xyz);
    //viewVec = vec3(0.0, 0.0, 1.0);
    reflectVec = normalize(2.0 * dot(vnormal.xyz, lightDir) * vnormal.xyz - lightDir);
    ksTotal = baseColor_s;
    // Changed from 0.0 to 0.0001 to prevent pow(0,0) which causes unintentional black shadow
    ISpecular_3D = ksTotal * pow(max(0.0001, dot(reflectVec, viewVec)), Ns);
    ISpecular = ISpecular_3D;
    //ISpecular = vec3(0.0, 0.0, 0.0);

    fragColor = vec4(IDiffuse.rgb + IAmbient + ISpecular, IDiffuse.a);
    //fragColor = vec4(1,0,0,0);

}