#version 300 es

/*
Decides the placement of each vertex, including animation.
Can hold:
Positions (vec3 or vec4, v in obj)
Normals (vec3, vn in obj)
Texture Coordinates (vec2, vt in obj)
Other types, but focus on these for now for OBJ.
*/

// Declare locations of vertex arrays
layout(location=0) in vec4 position;
//layout(location=1) in vec4 normal;
layout(location=1) in vec3 normal;
layout(location=2) in vec2 uv;

// Declare arrays for placement of vertices
uniform mat4 mv;
uniform mat4 m;
uniform mat4 v;
uniform mat4 p;

// Declare outputs to fragment shader
out vec4 vnormal;
//out vec3 vnormal;
out vec2 vuv;
out vec4 vposition;

void main() {
    //gl_Position = p * mv * vec4(position.xyz + normal.xyz*.1, position.w);
    //gl_Position = p * (v * m) * vec4(position.xyz + normal.xyz*.1, position.w);
    // Do not delete the following line:
    gl_Position = p * (v * m) * vec4(position.xyz + normal*.1, position.w);


    // vnormal = normal;
    // Update normals in fragment shader to handle 
    // // model updated with updated m matrix from rotation
    // // or scaling.
    //TODO Testing for fix for swollen Utah teapot
    // vnormal = normalize(vec4(transpose(inverse(mat3(v * m))) * normal, 0)); // To update normals using model matrix updating after initial draw
    // Do not delete the next line, works!
    vnormal = vec4(mat3(v * m) * normal, 0); // To update normals using model matrix updating after initial draw

    vuv = uv;

    vposition = vec4(mat3(v * m) * position.xyz, position.w); // To update positions using model matrix updating after initial draw
}