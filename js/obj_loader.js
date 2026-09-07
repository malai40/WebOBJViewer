// Import objects from other js files
import { Material } from './material.js';
import { TriangularMesh } from './mesh.js';
import { Model } from './model.js';

/**
 * Object that loads .obj files and components
 * obj to Mesh object
 * mtl and texture files to Material object(s)
 */
export class OBJLoader {
    constructor(gl) { // TODO Clean up this.gl's.
        this.gl = gl;
    }
    
    // async so files are all loaded before translating to model
    async load(files) {        
        let objTextContent = "";
        let mtlTextContent = "";
        let mtlTextContents = [];
        const localImagesBlobMap = {}; // Maps: { "img0.jpg": Blob/File Object }
        
        let model = null;
        
        // Get promises for files to make sure everything is loaded before 
        // // processing.
        const fileReadPromises = Array.from(files).map(file => {
            return new Promise((resolve) => {
                const filetype = file.name.split('.').pop().toLowerCase();
                console.log("Loading ", filetype, "file...");
                if (filetype === "obj" || filetype === "mtl") {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        if (filetype === "obj") {
                            objTextContent = e.target.result;
                        } 
                        if (filetype === "mtl") {
                            mtlTextContent = e.target.result;
                            mtlTextContents.push(mtlTextContent);
                        }
                        resolve();
                    };
                    reader.readAsText(file);
                } else if (["png", "jpg", "jpeg"].includes(filetype)){
                    // Assume it's texture image and try to load
                    // TODO Error handling and file type restrictins.
                    localImagesBlobMap[file.name] = file;
                    resolve();
                } else {
                    // Do nothing.
                    resolve();
                }
                
            });
        });
        
        // Wait for everything to load
        await Promise.all(fileReadPromises);
        
        // If no obj file correctly loaded, stop.
        if (!objTextContent) {
            console.log("Failed to load OBJ file. Returning.");
            return null;
        }
        
        // Process mesh
        model = await this.loadMesh(objTextContent, this.gl);
        
        // Process material file(s) text content
        for (const mtlText of mtlTextContents) {
            // Process materials
            model = this.loadMaterial(mtlText, gl, model);
        }
        
        // Process images
        model = this.loadTextures(localImagesBlobMap, gl, model);
        
        console.log("Loader output 0:", model);
        return model;
        
    }
    
    // Load mesh from .obj file
    loadMesh(fileContent, gl) {
        let v_io = [];
        let vn_io = [];
        let vt_io = [];
        
        let v = [];
        let vn = [];
        let vt = [];
        let f = [];
        
        let thisMaterial = '';
        
        let materialMap = {}; // To track which vertices go to which face integer
        let vertexMap = {}; // To track unique vertices
        
        let posCounter = 0;
        let faceCounter = 0;
        
        // Declare list of material libraries found in .obj file.
        // If this is empty when Model object parses, Model will
        // // declare default Material to get model visible.
        let materialLocs = [];
        
        const lines = fileContent.split('\n');
        
        for (const line of lines) {
            // Split line into tokens
            const tokens = line.split(' '); // TODO Check if OBJ ever uses other splits like tabs
            
            // Save any line starting with "v" as a vertex.
            if (tokens[0] === "v") {
                let x = parseFloat(tokens[1]);
                let y = parseFloat(tokens[2]);
                let z = parseFloat(tokens[3]);
                v_io.push([x, y, z]);
            }
            // Save any line starting with "vn" as a vertex normal.
            else if (tokens[0] === "vn") {
                let x = parseFloat(tokens[1]);
                let y = parseFloat(tokens[2]);
                let z = parseFloat(tokens[3]);
                vn_io.push([x, y, z]);
            }            
            // Save any line starting with "vt" as texture coordinates.
             else if (tokens[0] === "vt") {
                let u = parseFloat(tokens[1]);
                let v = parseFloat(tokens[2]);
                let z = parseFloat(tokens[3]);
                vt_io.push([u, v]);
            }
            // Save any line starting with "mtllib" to array listing all
            // // materials for this Model.
            else if (tokens[0] === "mtllib") {
                materialLocs.push(tokens[1]);
            }            
            // Save any line starting with "usemtl" as definition for how to handle
            // // upcoming faces for materials.
            // // Each Material object will define its own shader program.
            else if (tokens[0] === "usemtl") {
                thisMaterial = tokens[1];
            }
            // Save any line starting with "f" as a face.
            // "f" lines can look like 1/1/1 2/2/2 3/3/3
            // First number in each truple is first vertex.
            // Second number in each truple is first vertex normal. Optional.
            // Third number in each truple is first texture coordinate. Optional.
            // OBJ starts counting from 1, not 0.    
            // TODO Handle triangulating obj with four vertices per face.
            // // WebGL can only handle triangles so triangulation during file I/O is needed.
            else if (tokens[0] === "f") {
                // TODO If tokens.slice(1).length > 3, triangulate.
                // Process the new list of truples. Or return as array if already just 3.
                let fTriangulatedLines = this.#triangulatefLine(tokens.slice(1)); //array of 3D arrays of 3 vertices each
                // For each combination of v/vt/vn found, we create new position in the
                // // v, vt, vn arrays. 
                // All v, vn and vt should be loaded.
                // Four cases for f line:
                // 1) v1         v2         v3
                // 2) v1/vt1     v2/vt2     v3/vt3
                // 3) v1//vn1    v2//vn2    v3//vn3
                // 4) v1/vt1/vn1 v2/vt2/vn2 v3/vt3/vn3
                // Add to a dictionary of materials and their faces
                // Declare holder for the triangle defined by each 3 vertices in f line
                let thisTri = [];
                //for (const token of tokens.slice(1)) {
                for (const fTriangulatedLine of fTriangulatedLines) {
                    for (const token of fTriangulatedLine) {
                        // Example token: "13/13/13"
                        // Test if token is in vertexMap
                        if (vertexMap[token] === undefined) {
                            // Record that this unique token 
                            // // has face at position posCounter in faces array.
                            vertexMap[token] = posCounter;
                            // Get subtokens
                            const tokens_sub = token.split('/');
                            // Read each into arrays
                            let this_v = v_io[parseInt(tokens_sub[0]) - 1]; // vertex at pos tokens_sub-1 in v_io
                            // Flatten with ... for WebGL buffers
                            v.push(...this_v);
                            if (tokens_sub.length == 2) {
                                // Read the vt
                                let this_vt = vt_io[parseInt(tokens_sub[1]) - 1];
                                vt.push(...this_vt);
                            } else if (tokens_sub.length == 3) {
                                // See if second subtoken has anything
                                if (tokens_sub[1].length > 0) {
                                    let this_vt = vt_io[parseInt(tokens_sub[1]) - 1];
                                    vt.push(...this_vt);
                                }
                                // Read the vn
                                let this_vn = vn_io[parseInt(tokens_sub[2]) - 1];
                                vn.push(...this_vn);
                            }
                            thisTri.push(posCounter);
                            // Increase posCounter
                            posCounter++;
                        } else {
                            // This token is already read in.
                            thisTri.push(vertexMap[token]);
                        }
                    }
                }
                // Push this triangle to materialMap
                materialMap[thisMaterial] ||= []; 
                materialMap[thisMaterial].push(thisTri);
                // Push this triangle (face) to f array. Flattened for WebGL buffer.
                f.push(...thisTri);
            }             
        }
        // Create Mesh Object
        const mesh = new TriangularMesh(gl, v, f, vn, vt);
        
        // Create new Model object (will have Material objects added later)
        const model = new Model(gl, mesh, materialLocs, materialMap);
        
        //console.log("Loader output 1:", model);

        return model;        
    }

    
    /**
     * Load material from .mtl file
     */
    loadMaterial(fileContent, gl, model) {
        let thisMaterial = null;
        let materials = [];
        //console.log(fileContent);
        
        const lines = fileContent.split('\n');
        
        for (const line of lines) {
            
            // Split line into tokens
            const tokens = line.split(' '); // TODO Check if OBJ ever uses other splits like tabs
            
            if (tokens[0] === "newmtl") {
                // console.log(tokens[0]);
                // Finalize any existing Material object
                if (!thisMaterial == null) {
                    materials.push(thisMaterial);
                    //console.log("This material:", thisMaterial);
                    //console.log("Materials so far:", materials);
                }
                // Set name for new Material object
                thisMaterial = new Material(gl, tokens[1]);
                //console.log("This material:", thisMaterial);
                //console.log("Materials so far:", materials);
            }
            else if (tokens[0] === "Ka") {
                thisMaterial.Ka = [parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])];
            }
            else if (tokens[0] === "Kd") {
                thisMaterial.Kd = [parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])];
            }
            else if (tokens[0] === "Ks") {
                thisMaterial.Ks = [parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])];
            }
            else if (tokens[0] === "Tr") {
                thisMaterial.Tr = parseFloat(tokens[1]);
            } 
            else if (tokens[0] === "illum") {
                thisMaterial.illum = parseInt(tokens[1]);
            } 
            else if (tokens[0] === "d") {
                thisMaterial.d = parseFloat(tokens[1]);
            } 
            else if (tokens[0] === "Ns") {
                thisMaterial.Ns = parseFloat(tokens[1]);
            } 
            else if (tokens[0] === "sharpness") {
                thisMaterial.sharpness = parseInt(tokens[1]);
            } 
            else if (tokens[0] === "Ni") {
                thisMaterial.Ni = parseFloat(tokens[1]);
            } 
            else if (tokens[0] === "map_Ka") {
                thisMaterial.map_Ka = tokens[1];
            } 
            else if (tokens[0] === "map_Kd") {
                thisMaterial.map_Kd = tokens[1];
            } 
            else if (tokens[0] === "map_Ks") {
                thisMaterial.map_Ks = tokens[1];
            }
            else if (tokens[0] === "map_Ns") {
                thisMaterial.map_Ns = tokens[1];
            }
            else if (tokens[0] === "map_d") {
                thisMaterial.map_d = tokens[1];
            }
            else if (tokens[0] === "disp") {
                thisMaterial.disp = tokens[1];
            }
            else if (tokens[0] === "decal") {
                thisMaterial.decal = tokens[1];
            }
            else if (tokens[0] === "bump") {
                thisMaterial.bump = tokens[1];
            }
            
        }

        // Assign last Material to list
        materials.push(thisMaterial);
        
        // Assign the materials list to Model.
        model.materials.push(...materials);
        
        return model;
    }
    
    /**
     * Load images from .mtl file 
     */
    loadTextures(localImagesBlobMap, gl, model) {
        let procImgMap = {};
        for (const [fileName, fileBlob] of Object.entries(localImagesBlobMap)) {
            // Create placeholder for texture image
            const textureObject = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, textureObject);

            // Placeholder 1x1 pixel in case texture image load fails.
            // In that case, model will use this as texture image instead.
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));

            const localUrl = URL.createObjectURL(fileBlob);
            const imgWorker = new Image();
            imgWorker.src = localUrl;
            
            // Get the image if possible
            imgWorker.onload = () => {
                gl.bindTexture(gl.TEXTURE_2D, textureObject);
                // Flip image horizontally to accomodate WebGL reading image from 
                // // bottom left corner instead of top left.
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);                
                // Copy browser CPU memory onto GPU
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgWorker);
                gl.generateMipmap(gl.TEXTURE_2D);
                
                URL.revokeObjectURL(localUrl); // Clean up memory reference leaks
            };
            
            // Overwrite the raw File blob with the live WebGL Texture object container reference
            procImgMap[fileName] = textureObject;
        }
        
        model.localImagesBlobMap = procImgMap;
        
        return model;
    }
    
    /**
     * If tokens.slice(1).length > 3, triangulate.
     * Process the new list of truples. Or return as array if already just 3.
     * This version uses fan triangulation, which is O(n) but can't handle concave polygons.
     * Another version will use ear clipping which while significantly slower can handle concave polygons.
     * Do not use this function with concave polygons, otherwise visual errors may result.
     * This function assumes the points are in CCW order, and it triangulates in CCW order. 
     * TODO Find if issues triangulating CCW on CW-ordered polygon.
     * fTriangulatedLines = triangulatefLine(tokens.slice(1)); //array of 3D arrays of 3 vertices each
     */
    #triangulatefLine(fTokens) {
        if (fTokens.length <= 3) {
            return [fTokens];
        } else {
            //console.log("Triangulating: ", fTokens);
            const n = fTokens.length;
            let triangulatedTokens = [];
            let thisTriMid = [];
            let thisTriFnl = [];
            // Phase 1: Start at v1
            // Phase 2: Loop through all vertices from 
            // // (v1 + 2) to (v1 + (n - 1)).
            // // i starts at 3 and ends at (n - 1).
            // // Doing [v1, v(i-1), v(i)]. Switch to [v1, v(i), v(i-1)] for CW triangulation.
            for (let i = 3; i < n; i++) {
                thisTriMid = [fTokens[1], fTokens[i-1], fTokens[i]];
                triangulatedTokens.push(thisTriMid);
            }
            // Phase 3: Do [v1, v(n-1), v0] (or [v1, v0, v(n-1)] for CW triang). Finished.
            thisTriFnl = [fTokens[1], fTokens[n-1], fTokens[0]];
            triangulatedTokens.push(thisTriFnl);
            //console.log("Result: ", triangulatedTokens);
            return triangulatedTokens;

        }
    }
}