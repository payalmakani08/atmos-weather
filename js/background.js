// ==========================================
// ATMOS - 3D WEATHER BACKGROUND
// ==========================================

(() => {

    const canvas =
        document.getElementById(
            "weather3D"
        );


    if (!canvas || !window.THREE) {

        console.warn(
            "Three.js or canvas missing."
        );

        return;

    }


    const THREE =
        window.THREE;


    // ======================================
    // SCENE
    // ======================================

    const scene =
        new THREE.Scene();


    scene.fog =
        new THREE.FogExp2(
            0x07152e,
            0.025
        );


    // ======================================
    // CAMERA
    // ======================================

    const camera =
        new THREE.PerspectiveCamera(
            60,
            window.innerWidth /
                window.innerHeight,
            0.1,
            100
        );


    camera.position.set(
        0,
        0,
        12
    );


    // ======================================
    // RENDERER
    // ======================================

    let renderer;


    try {

        renderer =
            new THREE.WebGLRenderer({
                canvas: canvas,
                alpha: true,
                antialias: true
            });

    } catch (error) {

        console.warn(
            "3D renderer failed."
        );

        return;

    }


    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            1.5
        )
    );


    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );


    // ======================================
    // LIGHT
    // ======================================

    const ambientLight =
        new THREE.AmbientLight(
            0xffffff,
            1.5
        );


    scene.add(
        ambientLight
    );


    const sunlight =
        new THREE.PointLight(
            0xffc857,
            4,
            60
        );


    sunlight.position.set(
        4,
        4,
        5
    );


    scene.add(
        sunlight
    );


    // ======================================
    // WEATHER WORLD
    // ======================================

    const world =
        new THREE.Group();


    scene.add(
        world
    );


    // ======================================
    // SUN
    // ======================================

    const sun =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                1.5,
                32,
                32
            ),

            new THREE.MeshBasicMaterial({
                color:
                    0xffc857
            })

        );


    sun.position.set(
        4,
        3,
        -2
    );


    world.add(
        sun
    );


    // ======================================
    // SUN GLOW
    // ======================================

    const sunGlow =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                2.2,
                32,
                32
            ),

            new THREE.MeshBasicMaterial({

                color:
                    0xffc857,

                transparent:
                    true,

                opacity:
                    0.12,

                depthWrite:
                    false

            })

        );


    sunGlow.position.copy(
        sun.position
    );


    world.add(
        sunGlow
    );


    // ======================================
    // CLOUDS
    // ======================================

    const clouds = [];


    function createCloud(
        x,
        y,
        z,
        scale
    ) {

        const group =
            new THREE.Group();


        const material =
            new THREE.MeshStandardMaterial({

                color:
                    0xb7d4f2,

                roughness:
                    1,

                transparent:
                    true,

                opacity:
                    0.65,

                flatShading:
                    true

            });


        const parts = [

            [-0.8, 0, 0, 0.8],

            [0, 0.3, 0, 1],

            [0.8, 0, 0, 0.7],

            [0.25, -0.2, 0.2, 0.8]

        ];


        parts.forEach(
            ([px, py, pz, size]) => {

                const mesh =
                    new THREE.Mesh(

                        new THREE.IcosahedronGeometry(
                            size,
                            2
                        ),

                        material

                    );


                mesh.position.set(
                    px,
                    py,
                    pz
                );


                group.add(
                    mesh
                );

            }
        );


        group.position.set(
            x,
            y,
            z
        );


        group.scale.setScalar(
            scale
        );


        world.add(
            group
        );


        clouds.push({

            group,

            baseX:
                x,

            speed:
                0.12 +
                Math.random() *
                0.12

        });

    }


    createCloud(
        -5,
        2,
        -3,
        1.1
    );


    createCloud(
        0,
        4,
        -5,
        0.8
    );


    createCloud(
        5,
        1,
        -4,
        1.3
    );


    createCloud(
        -2,
        -2,
        -3,
        0.8
    );


    // ======================================
    // WEATHER PARTICLES
    // ======================================

    const particleCount =
        window.innerWidth < 600
            ? 300
            : 600;


    const positions =
        new Float32Array(
            particleCount * 3
        );


    const velocities =
        new Float32Array(
            particleCount
        );


    for (
        let i = 0;
        i < particleCount;
        i++
    ) {

        positions[i * 3] =
            (Math.random() - 0.5) *
            24;


        positions[i * 3 + 1] =
            (Math.random() - 0.5) *
            18;


        positions[i * 3 + 2] =
            (Math.random() - 0.5) *
            10;


        velocities[i] =
            0.05 +
            Math.random() *
            0.15;

    }


    const particleGeometry =
        new THREE.BufferGeometry();


    particleGeometry.setAttribute(

        "position",

        new THREE.BufferAttribute(
            positions,
            3
        )

    );


    const particleMaterial =
        new THREE.PointsMaterial({

            color:
                0x7de8ff,

            size:
                0.05,

            transparent:
                true,

            opacity:
                0.7,

            depthWrite:
                false

        });


    const particles =
        new THREE.Points(

            particleGeometry,

            particleMaterial

        );


    scene.add(
        particles
    );


    // ======================================
    // WEATHER TYPE
    // ======================================

    let weatherType =
        "sunny";


    let lightning =
        0;


    let lastLightning =
        0;


    const skyColors = {

        sunny:
            0x0d4670,

        cloudy:
            0x253c5a,

        rain:
            0x101d35,

        snow:
            0x6f89a4,

        storm:
            0x100e27

    };


    // ======================================
    // UPDATE WEATHER SCENE
    // ======================================

    function updateWeatherScene(
        code
    ) {

        code =
            Number(code);


        if (code >= 95) {

            weatherType =
                "storm";

        }

        else if (
            code >= 71 &&
            code <= 77
        ) {

            weatherType =
                "snow";

        }

        else if (
            (
                code >= 51 &&
                code <= 67
            ) ||
            (
                code >= 80 &&
                code <= 82
            )
        ) {

            weatherType =
                "rain";

        }

        else if (
            code >= 2 &&
            code <= 48
        ) {

            weatherType =
                "cloudy";

        }

        else {

            weatherType =
                "sunny";

        }


        const color =
            new THREE.Color(
                skyColors[
                    weatherType
                ]
            );


        scene.background =
            color;


        scene.fog.color =
            color;


        // SUN
        sun.visible =
            weatherType === "sunny" ||
            weatherType === "cloudy";


        sunGlow.visible =
            sun.visible;


        // CLOUDS
        clouds.forEach(
            ({ group }) => {

                group.visible =
                    weatherType !==
                    "sunny";

            }
        );


        // PARTICLES
        if (
            weatherType === "rain" ||
            weatherType === "storm"
        ) {

            particleMaterial.color.set(
                0x70cfff
            );

            particleMaterial.size =
                0.045;

            particleMaterial.opacity =
                0.85;

        }

        else if (
            weatherType === "snow"
        ) {

            particleMaterial.color.set(
                0xffffff
            );

            particleMaterial.size =
                0.11;

            particleMaterial.opacity =
                0.9;

        }

        else {

            particleMaterial.color.set(
                0x9cecff
            );

            particleMaterial.size =
                0.035;

            particleMaterial.opacity =
                0.25;

        }

    }


    // ======================================
    // LOAD SAVED WEATHER
    // ======================================

    const savedCode =
        localStorage.getItem(
            "selectedWeatherCode"
        );


    if (savedCode !== null) {

        updateWeatherScene(
            savedCode
        );

    }

    else {

        updateWeatherScene(
            0
        );

    }


    // ======================================
    // LIVE WEATHER UPDATE
    // ======================================

    window.addEventListener(
        "weatherChanged",
        event => {

            if (
                event.detail &&
                event.detail.code !==
                    undefined
            ) {

                updateWeatherScene(
                    event.detail.code
                );

            }

        }
    );


    // ======================================
    // ANIMATION
    // ======================================

    const clock =
        new THREE.Clock();


    function animate() {

        requestAnimationFrame(
            animate
        );


        const elapsed =
            clock.getElapsedTime();


        // SUN ROTATION
        sun.rotation.y +=
            0.002;


        // SUN PULSE
        sunGlow.scale.setScalar(

            1 +
            Math.sin(
                elapsed * 1.5
            ) *
            0.04

        );


        // CLOUD MOVEMENT
        clouds.forEach(
            ({
                group,
                baseX,
                speed
            }) => {

                group.position.x =
                    baseX +
                    Math.sin(
                        elapsed * speed
                    ) *
                    0.6;

            }
        );


        // PARTICLES
        const particlePositions =
            particleGeometry
                .attributes
                .position
                .array;


        for (
            let i = 0;
            i < particleCount;
            i++
        ) {

            const index =
                i * 3;


            if (
                weatherType === "rain" ||
                weatherType === "storm"
            ) {

                particlePositions[
                    index + 1
                ] -=
                    velocities[i] * 3;


                particlePositions[
                    index
                ] -=
                    velocities[i] * 0.25;

            }

            else if (
                weatherType === "snow"
            ) {

                particlePositions[
                    index + 1
                ] -=
                    velocities[i] * 0.5;


                particlePositions[
                    index
                ] +=
                    Math.sin(
                        elapsed + i
                    ) *
                    0.002;

            }

            else {

                particlePositions[
                    index + 1
                ] +=
                    Math.sin(
                        elapsed + i
                    ) *
                    0.001;


                particlePositions[
                    index
                ] +=
                    Math.cos(
                        elapsed + i
                    ) *
                    0.001;

            }


            if (
                particlePositions[
                    index + 1
                ] < -9
            ) {

                particlePositions[
                    index + 1
                ] = 9;


                particlePositions[
                    index
                ] =
                    (
                        Math.random() -
                        0.5
                    ) *
                    24;

            }

        }


        particleGeometry
            .attributes
            .position
            .needsUpdate = true;


        // ==================================
        // LIGHTNING
        // ==================================

        if (
            weatherType === "storm"
        ) {

            if (
                elapsed -
                lastLightning >
                5 +
                Math.random() * 5
            ) {

                lightning = 1;

                lastLightning =
                    elapsed;

            }


            if (lightning > 0) {

                renderer.setClearColor(
                    0xb7d8ff,
                    lightning * 0.2
                );

                lightning -=
                    0.04;

            }

            else {

                renderer.setClearColor(
                    0x000000,
                    0
                );

            }

        }

        else {

            renderer.setClearColor(
                0x000000,
                0
            );

        }


        // ==================================
        // RENDER
        // ==================================

        renderer.render(
            scene,
            camera
        );

    }


    animate();


    // ======================================
    // RESIZE
    // ======================================

    window.addEventListener(
        "resize",
        () => {

            camera.aspect =
                window.innerWidth /
                window.innerHeight;


            camera.updateProjectionMatrix();


            renderer.setPixelRatio(
                Math.min(
                    window.devicePixelRatio,
                    1.5
                )
            );


            renderer.setSize(
                window.innerWidth,
                window.innerHeight
            );

        }
    );


})();
