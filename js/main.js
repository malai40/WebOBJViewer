// Import objects from other js files
import { Material } from './material.js';
import { TriangularMesh } from './mesh.js';
import { Model } from './model.js';
import { OBJLoader } from './obj_loader.js';
import { BoundingBox } from './bounding_box.js';

// Get elements
const filesInput = document.getElementById("filesInput");

// Model is in global space so window can see it when ready
let currentModel = null;

// mvp matrices in global space so other classes can read/write.
// m: Model matrix. Moves, rotates, and scales model.
// v: View matrix. Sets position and orientation of camera.
// p: Projection matrix. Defines field of view.
let aspect = null; //gl.canvas.width / gl.canvas.height;
let m = null;
let v = null;
let p = null;

// Declare default axis rotational fix and scaling
// Source for m4rotX numbers: UIUC CS 418 course website
//let mStartXRotFix = m4rotX(-Math.PI / 2);
//let mStartScale = m4scale(0.5, 0.5, 0.5);
let mCenterTransFix = m4trans(0.0, 0.0, 0.0);
let mCenterTransFixReverse = m4trans(0.0, 0.0, 0.0);

/**
 * Draw loop that updates the model on screen.
 * @param {Number} timestamp - time in the browser 
 */
function renderLoop(timestamp) {
    // Clear screen with new bg color
    gl.clearColor(0.5, 0.5, 0.5, 1.0); 
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw model if one has been loaded
    if (currentModel !== null) {
        currentModel.drawModel(gl, m, v, p);
    }

    // Recurse to keep animation going
    requestAnimationFrame(renderLoop);
}

// Add event listeners for main.js
/**
 * Add event listeners for window (viewable by anything in the project)
 * This one is upon window loading (once)
 */
window.addEventListener('load', async () => {
    const canvas = document.getElementById("webgl-canvas");
    window.gl = canvas.getContext("webgl2");
    // TODO Add alert if WebGL2 not supported
    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    // Enable 3D depth layering
    gl.enable(gl.DEPTH_TEST);
    
    // Get aspect ratio of canvas
    aspect = gl.canvas.width / gl.canvas.height;
    
    // Declare starting MVP matrices
    // Model matrix
    // Rotate model to help Z-up to Y-up translation shenanigans, then scale to fit within canvas
    // By default it loads at (0, 0, 0) which is center of canvas
    //m_rotX = m4rotX(-Math.PI / 2); // Stand the model up. This works well since so many models struggle with export from Z-up software to Y-up WebGL
    //m = m4mul(mStartXRotFix, mStartScale);
    // View matrix (like camera). [eye, lookat, world_up]
    v = m4view([1,1,3], [0,0,0], [0,1,0]);
    // p = m4perspective(45 * Math.PI / 180, aspect, 0.1, 100.0);}
    // Perspective matrix
    // Source for numbers: UIUC CS 418 course website
    p = m4perspNegZ(0.1, 100.0, 45 * Math.PI / 180, gl.canvas.width, gl.canvas.height);
    
    // Declare window program
    // Cleanse shader files of Windows carriage returns
    // TODO Load various programs combining different shaders per illum type. Lambertian, Phong, etc.
    const vs = await fetch('./shaders/vertex_shader.glsl').then(res => res.text()).then(text => text.replace(/\r/g, '').trim());
    const fs = await fetch('./shaders/fragment_shader.glsl').then(res => res.text()).then(text => text.replace(/\r/g, '').trim());
    window.program = compile(vs,fs);
    
});

/**
 * Add event listeners for mouse movement
 * Mouse movement will update M matrix in global space for renderLoop to use.
 */
function setupDragToMove() {
    const canvas = document.getElementById("webgl-canvas");

    let isDragging = false;
    let startX = null;
    let startY = null;
    let speed = 0.01; // Speed of rotation when dragged

    // Listen for user clicking mouse down/tapping in canvas
    canvas.addEventListener("pointerdown", (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        canvas.setPointerCapture(e.pointerId);
    });

    // Listen for user letting go of mouse
    canvas.addEventListener("pointermove", (e) => {
        if (isDragging == false) {
            return;
        } else {
            // Find how much model rotates left or right (around WebGL's Z axis)
            let changeX = e.clientX - startX;
            const rotX = changeX * speed * (Math.PI / 4);
            const mrotZ = m4rotZ(rotX);
            startX = e.clientX;

            // Find how much model rotates up or down (around WebGL's X axis)
            let changeY = e.clientY - startY;
            const rotY = changeY * speed * (Math.PI / 4);
            const mrotY = m4rotY(rotY);
            startY = e.clientY;

            // Get the final result
            //m = m4mul(mrotX, mrotY);
            m = m4mul(m, mCenterTransFixReverse, mrotY, mrotZ, mCenterTransFix); //, mStartXRotFix); //, mStartScale);
        }
    });

    // Listen for user letting go of mouse
    canvas.addEventListener("pointerup", (e) => {
        isDragging = false;
        startX = e.clientX;
        startY = e.clientY;

        canvas.releasePointerCapture(e.pointerId);

    });

}

// Call the mouse dragging listeners
setupDragToMove();

/**
 * Add event listeners for loading files
 */
filesInput.addEventListener("change", async (event) => {
    // Load the files given by User
    const files = event.target.files;
    
    if (files.length < 1) {
        // Nothing loaded
        console.log("0 files detected.");
        return;
    }

    // Create loader Object
    let loader = new OBJLoader(gl);
    
    // Load files
    const model = await loader.load(files);
    
    console.log("Model loaded from file.");
    
    // Push model to global scope so window can see it
    currentModel = model;

    // Calculate starting rotation and scale based on model stats
    // m = m4mul(mStartXRotFix, mStartScale);
    const boundingBox = model.boundingBox;
    // console.log(boundingBox, boundingBox.get_center(), boundingBox.get_longest_axis());
    // 1. Make sure model is Scaled so longest axis is less than 1.5 (total canvas is [-1, +1] plus breathing room on all sides)
    const len_longest_axis = boundingBox.get_len_axis(boundingBox.get_longest_axis());
    const scale_factor = 2.0 / len_longest_axis;
    const mStartScale = m4scale(scale_factor, scale_factor, scale_factor);
    // const mStartScale = m4scale(0.5, 0.5, 0.5);
    // 2. Make sure model is Rotated by assume if this is Y up or Z up
    // TODO Have user choose if Y up or Z up
    // Assume Y up if len_y > len_z, or assume Z up if len_z > len_y
    let mStartXRotFix = m4rotX(0);
    if (boundingBox.get_longest_axis() == 2) { // Z axis is longer than Y, so assume model is Z up
        mStartXRotFix = m4rotX(-Math.PI / 2);
    } else { // Y axis is longer than Z, so no rotation (model is already Y up)
        //const mStartXRotFix = m4rotX(0);
    }
    // mStartXRotFix = m4rotX(-Math.PI / 2);
    // 3. Make sure model is Translated so center becomes (0,0,0)
    //console.log(boundingBox.get_center());
    let dx = 0;
    let dy = 0;
    let dz = 0;
    const center = boundingBox.get_center();
    if (center[0] != 0) {
        dx = 0 - center[0];
    }
    if (center[1] != 0) {
        dy = 0 - center[1];
    }
    if (center[2] != 0) {
        dz = 0 - center[2];
    }
    mCenterTransFix = m4trans(dx,dy,dz);
    mCenterTransFixReverse = m4trans(dx * -1, dy * -1, dz * -1);
    m = m4mul(mStartXRotFix, mStartScale, mCenterTransFix);
    
    // Begin animating the model on screen
    requestAnimationFrame(renderLoop);

});

/**
 * Compiles two shaders, links them together, looks up their uniform locations,
 * and returns the result. Reports any shader errors to the console.
 *
 * @param {string} vs_source - the source code of the vertex shader
 * @param {string} fs_source - the source code of the fragment shader
 * @return {WebGLProgram} the compiled and linked program
 * Source: UIUC CS 418 course website. https://cs418.cs.illinois.edu/website/code/3d-webgl/3-color.html
 */
function compile(vs_source, fs_source) {
    const vs = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vs, vs_source)
    gl.compileShader(vs)
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(vs))
        throw Error("Vertex shader compilation failed")
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fs, fs_source)
    gl.compileShader(fs)
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(fs))
        throw Error("Fragment shader compilation failed")
    }

    const program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program))
        throw Error("Linking failed")
    }
    
    const uniforms = {}
    for(let i=0; i<gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i+=1) {
        let info = gl.getActiveUniform(program, i)
        uniforms[info.name] = gl.getUniformLocation(program, info.name)
    }
    program.uniforms = uniforms

    return program
}