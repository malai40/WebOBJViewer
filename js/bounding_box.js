/**
 * Defines bounding box object 
 * This surrounds a mesh in 3D space.
 */

// Import objects from other js files
/*
import { Material } from './material.js';
import { Model } from './model.js';
import { OBJLoader } from './obj_loader.js';
*/

export class BoundingBox {
    constructor(min_vector = [0.0, 0.0, 0.0], max_vector = [0.0, 0.0, 0.0]){ //v, f, vn = [], vt = [], materialLocs = [], smooth_shaded = true, buffer_usage = gl.STATIC_DRAW, num_shader = 0) {
        this.min_vector = min_vector; // Min XYZ
        this.max_vector = max_vector; // Max XYZ
    }
    /**
     * Get length of x axis of this box
     * @returns Length of x axis of this box
     */
    get_len_x() {
        return this.max_vector[0] - this.min_vector[0];
    }

    /**
     * Get length of y axis of this box
     * @returns Length of y axis of this box
     */
    get_len_y() {
        return this.max_vector[1] - this.min_vector[1];
    }

    /**
     * Get length of z axis of this box
     * @returns Length of z axis of this box
     */
    get_len_z() {
        return this.max_vector[2] - this.min_vector[2];
    }

    /**
     * Get min x of the box
     * @returns Min x of the box
     */
    get_min_x() {
        return this.min_vector[0];
    }

    /**
     * Get min y of the box
     * @returns Min y of the box
     */
    get_min_y() {
        return this.min_vector[1];
    }

    /**
     * Get min z of the box
     * @returns Min z of the box
     */
    get_min_z() {
        return this.min_vector[2];
    }

    /**
     * Get max x of the box
     * @returns Max x of the box
     */
    get_max_x() {
        return this.max_vector[0];
    }

    /**
     * Get max y of the box
     * @returns Max y of the box
     */
    get_max_y() {
        return this.max_vector[1];
    }

    /**
     * Get max z of the box
     * @returns Max z of the box
     */
    get_max_z() {
        return this.max_vector[2];
    }

    /**
     * Get midpoint of axis specified as integer in input
     * 0 == x, y == 1, z == 2
     * @param {int} axis
     * @returns Midpoint of axis specified as integer in input
     */
    get_len_axis(axis) {
        return this.max_vector[axis] - this.min_vector[axis];
    }

    /**
     * Get longest axis
     * @returns Longest axis
     */
    get_longest_axis() {
        const len_x = this.get_len_x();
        const len_y = this.get_len_y();
        const len_z = this.get_len_z();
        
        // To start, naively assume x is longest axis
        let longest_axis = 0;
        
        // Test if y is longer than x
        if (len_y > len_x) {
            longest_axis = 1;
        }
        if ((len_z > len_y) && (len_z > len_x)) {
            longest_axis = 2;
        }
        return longest_axis;
    }


    /**
     * Get center of this object in [x, y, z]
     * @returns Center of this object in [x, y, z]
     */
    get_center() {
        const center_x = this.get_min_x() + (this.get_len_x() / 2);
        const center_y = this.get_min_y() + (this.get_len_y() / 2);
        const center_z = this.get_min_z() + (this.get_len_z() / 2);

        return [center_x, center_y, center_z];
    }

}