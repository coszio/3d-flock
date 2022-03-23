import * as THREE from 'three'

export class Boid extends THREE.Mesh {
    velocity = new THREE.Vector3(0, 0, 0)
    acceleration = new THREE.Vector3(0, 0, 0)
    maxForce = 0.4
    maxSpeed = 0.6
    width = 80
    height = 50
    depth = 50
    viewDistance = 15

    constructor() {
        super(
            new THREE.ConeGeometry(0.5, 2, 5).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial({
                color: 'saddlebrown',
            })
        )
        this.position.set(
            (Math.random() * 2 - 0.5) * this.width,
            (Math.random() * 2 - 0.5) * this.height,
            (Math.random() * 2 - 0.5) * this.depth,
            
        )
        this.velocity.set(
            (Math.random() * 2 - 0.5) * 0.1,
            (Math.random() * 2 - 0.5) * 0.1,
            (Math.random() * 2 - 0.5) * 0.1
        )
        this.acceleration.copy(this.acceleration)
    }

    update(otherBoids: Boid[], strength = 0.006) {
        otherBoids = this.getNeighbors(otherBoids, Math.PI * 0.8 )
        this.separate(otherBoids, 0.2 * strength)
        this.align(otherBoids, 4 * strength)
        this.cohese(otherBoids, 3 * strength)
        this.move()
        this.constrain(80, 50)
    }

    /**
     *
     * @param neighbors An array of other boids that do not include this boid
     * @param strength How strong is the boid's separation force
     * @returns void
     */
    separate(neighbors: Boid[], strength: number = 0.003): void {
        // if there are no boids nearby, return
        if (neighbors.length === 0) {
            return
        }
        // get the sum of distances to the other boids
        let steering = new THREE.Vector3(0, 0, 0)
        for (const other of neighbors) {
            let diff = this.position.clone().sub(other.position)
            // inversely proportional to the distance
            diff.divideScalar(other.position.distanceTo(this.position) / this.viewDistance)
            steering.add(diff)
        }
        // steering.divideScalar(neighbors.length)
        steering.multiplyScalar(strength)

        this.acceleration.add(steering)
    }

    /**
     * Steers towards the average heading of the local flock
     *
     * @param neighbors An array of other neighboring boids
     * @returns void
     */
    align(neighbors: Boid[], strength: number = 0.011): void {
        let steering = new THREE.Vector3(0, 0, 0)

        if (neighbors.length === 0) {
            return
        }

        for (const other of neighbors) {
            const weightedVel = other.velocity.clone()
                .divideScalar(other.position.distanceTo(this.position) / this.viewDistance)
            steering.add(weightedVel)

        }
        // Steer towards the average direction
        steering.divideScalar(neighbors.length)
        steering.multiplyScalar(strength)

        this.acceleration.add(steering)
    }

    /**
     * Move towards the center of the local flock
     * @param otherBoids An array of other boids that do not include this boid
     * @param neighborDistance The distance to other boids that will be considered neighbors
     * @returns void
     */
    cohese(neighbors: Boid[], strength: number = 0.002): void {
        if (neighbors.length === 0) {
            return
        }
        let avgPosition = new THREE.Vector3(0, 0, 0)

        for (const other of neighbors) {
            avgPosition.add(other.position)
        }
        avgPosition.divideScalar(neighbors.length)

        // steer towards the average position
        let steering = avgPosition.sub(this.position)
        steering.multiplyScalar(strength)
        this.acceleration.add(steering)
    }

    /**
     * Updates the position of the boid using the current velocity and acceleration
     * @returns void
     */
    move() {
        this.velocity.clampLength(0, this.maxSpeed)
        this.acceleration.clampLength(0, this.maxForce)
        this.position.add(this.velocity)
        this.velocity.add(this.acceleration)
        this.lookAt(this.position.clone().sub(this.acceleration))
    }

    /**
     * Constrains the boid to the bounds of the scene
     * @returns void
     */
    constrain(width: number = 100, height: number = 50) {
        if (this.position.x > width) {
            this.position.x = -width
        }
        if (this.position.x < -width) {
            this.position.x = width
        }
        if (this.position.y > height) {
            this.position.y = -height
        }
        if (this.position.y < -height) {
            this.position.y = height
        }
        if (this.position.z > this.depth) {
            this.position.z = -this.depth
        }
        if (this.position.z < -this.depth) {
            this.position.z = this.depth
        }
    }

    /**
     * Gets the neighboring boids that can be perceived by this boid
     * @param otherBoids An array of boids
     * @param distance the maximum distance to be perceived by the boid
     * @param fov the angle of the boid's field of view, with respect to the pointing direction
     * @returns
     */
    getNeighbors(otherBoids: Boid[], fov: number = Math.PI / 1.5) {
        return otherBoids.filter((other) => {
            const vectorToOther = other.position.clone().sub(this.position)
            const angleToOther = this.velocity.angleTo(vectorToOther)
            return (
                other !== this &&
                this.position.distanceTo(other.position) < this.viewDistance &&
                angleToOther < fov
            )
        })
    }
}
