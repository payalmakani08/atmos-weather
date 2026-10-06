/* ==========================================
   ATMOS 3D WEATHER BACKGROUND
========================================== */

const canvas =
    document.getElementById(
        "weather3D"
    );

const ctx =
    canvas.getContext("2d");


let width;
let height;

let weatherCode = 0;
let isDay = true;


/* ==========================================
   PARTICLES
========================================== */

let particles = [];


function resizeCanvas() {

    width =
        canvas.width =
        window.innerWidth *
        devicePixelRatio;


    height =
        canvas.height =
        window.innerHeight *
        devicePixelRatio;


    canvas.style.width =
        window.innerWidth + "px";


    canvas.style.height =
        window.innerHeight + "px";


    ctx.setTransform(
        devicePixelRatio,
        0,
        0,
        devicePixelRatio,
        0,
        0
    );


    createParticles();

}


window.addEventListener(
    "resize",
    resizeCanvas
);


/* ==========================================
   WEATHER SCENE
========================================== */

window.setWeatherScene =
function(code, day) {

    weatherCode =
        code;

    isDay =
        Boolean(day);

    createParticles();

};


/* ==========================================
   PARTICLES
========================================== */

function createParticles() {

    particles = [];


    const amount =
        Math.min(
            180,
            Math.floor(
                window.innerWidth / 5
            )
        );


    for (
        let i = 0;
        i < amount;
        i++
    ) {

        particles.push({

            x:
                Math.random() *
                window.innerWidth,

            y:
                Math.random() *
                window.innerHeight,

            z:
                Math.random(),

            speed:
                1 +
                Math.random() * 3,

            size:
                1 +
                Math.random() * 3,

            alpha:
                .2 +
                Math.random() * .7

        });

    }

}


/* ==========================================
   DRAW
========================================== */

function draw() {

    ctx.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );


    drawSky();


    if (!isDay) {

        drawStars();

        drawMoon();

    }


    if (isDay) {

        drawSun();

    }


    if (
        [51,53,55,61,63,65,66,67,80,81,82,95,96,99]
            .includes(weatherCode)
    ) {

        drawRain();

    }


    if (
        [71,73,75,77,85,86]
            .includes(weatherCode)
    ) {

        drawSnow();

    }


    if (
        [1,2,3,45,48]
            .includes(weatherCode)
    ) {

        drawClouds();

    }


    if (
        [95,96,99]
            .includes(weatherCode)
    ) {

        drawLightning();

    }


    requestAnimationFrame(
        draw
    );

}


/* ==========================================
   SKY
========================================== */

function drawSky() {

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            window.innerHeight
        );


    if (isDay) {

        gradient.addColorStop(
            0,
            "#0757a8"
        );

        gradient.addColorStop(
            .5,
            "#1685d4"
        );

        gradient.addColorStop(
            1,
            "#102957"
        );

    }

    else {

        gradient.addColorStop(
            0,
            "#050817"
        );

        gradient.addColorStop(
            .5,
            "#101536"
        );

        gradient.addColorStop(
            1,
            "#090b21"
        );

    }


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );

}


/* ==========================================
   SUN
========================================== */

function drawSun() {

    const x =
        window.innerWidth * .82;

    const y =
        window.innerHeight * .12;


    const radius =
        Math.min(
            window.innerWidth,
            window.innerHeight
        ) * .07;


    const glow =
        ctx.createRadialGradient(
            x,
            y,
            radius * .2,
            x,
            y,
            radius * 3
        );


    glow.addColorStop(
        0,
        "rgba(255,245,180,.95)"
    );


    glow.addColorStop(
        .25,
        "rgba(255,215,80,.35)"
    );


    glow.addColorStop(
        1,
        "rgba(255,215,80,0)"
    );


    ctx.fillStyle =
        glow;


    ctx.beginPath();

    ctx.arc(
        x,
        y,
        radius * 3,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle =
        "#fff4a3";


    ctx.beginPath();

    ctx.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
    );

    ctx.fill();

}


/* ==========================================
   MOON
========================================== */

function drawMoon() {

    const x =
        window.innerWidth * .78;

    const y =
        window.innerHeight * .15;


    const radius =
        Math.min(
            window.innerWidth,
            window.innerHeight
        ) * .055;


    ctx.shadowBlur =
        35;

    ctx.shadowColor =
        "rgba(220,230,255,.6)";


    ctx.fillStyle =
        "#e8edff";


    ctx.beginPath();

    ctx.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.shadowBlur =
        0;

}


/* ==========================================
   STARS
========================================== */

function drawStars() {

    particles.forEach(
        particle => {

            const alpha =
                particle.alpha *
                (
                    .5 +
                    Math.sin(
                        Date.now() / 1000 +
                        particle.x
                    ) * .5
                );


            ctx.fillStyle =
                `rgba(255,255,255,${alpha})`;


            ctx.fillRect(
                particle.x,
                particle.y,
                particle.size,
                particle.size
            );

        }
    );

}


/* ==========================================
   CLOUDS
========================================== */

function drawClouds() {

    const cloudY =
        window.innerHeight * .22;


    drawCloud(
        window.innerWidth * .18,
        cloudY,
        1
    );


    drawCloud(
        window.innerWidth * .62,
        cloudY * .75,
        .8
    );


    drawCloud(
        window.innerWidth * .82,
        cloudY * 1.5,
        .65
    );

}


function drawCloud(
    x,
    y,
    scale
) {

    ctx.save();

    ctx.translate(
        x,
        y
    );

    ctx.scale(
        scale,
        scale
    );


    ctx.fillStyle =
        "rgba(225,235,255,.22)";


    ctx.beginPath();

    ctx.arc(
        0,
        25,
        35,
        0,
        Math.PI * 2
    );


    ctx.arc(
        40,
        10,
        45,
        0,
        Math.PI * 2
    );


    ctx.arc(
        85,
        25,
        32,
        0,
        Math.PI * 2
    );


    ctx.roundRect(
        -35,
        20,
        150,
        45,
        25
    );


    ctx.fill();

    ctx.restore();

}


/* ==========================================
   RAIN
========================================== */

function drawRain() {

    particles.forEach(
        particle => {

            particle.y +=
                particle.speed * 4;


            particle.x -=
                particle.speed * .5;


            if (
                particle.y >
                window.innerHeight
            ) {

                particle.y =
                    -20;

                particle.x =
                    Math.random() *
                    window.innerWidth;

            }


            ctx.strokeStyle =
                `rgba(130,210,255,${particle.alpha})`;


            ctx.lineWidth =
                1.3;


            ctx.beginPath();

            ctx.moveTo(
                particle.x,
                particle.y
            );


            ctx.lineTo(
                particle.x - 4,
                particle.y + 16
            );


            ctx.stroke();

        }
    );

}


/* ==========================================
   SNOW
========================================== */

function drawSnow() {

    particles.forEach(
        particle => {

            particle.y +=
                particle.speed;


            particle.x +=
                Math.sin(
                    particle.y / 30
                ) * .4;


            if (
                particle.y >
                window.innerHeight
            ) {

                particle.y =
                    -10;

            }


            ctx.fillStyle =
                `rgba(255,255,255,${particle.alpha})`;


            ctx.beginPath();

            ctx.arc(
                particle.x,
                particle.y,
                particle.size * 1.5,
                0,
                Math.PI * 2
            );

            ctx.fill();

        }
    );

}


/* ==========================================
   LIGHTNING
========================================== */

let lightningTime =
    0;


function drawLightning() {

    if (
        Date.now() -
        lightningTime >
        5000 +
        Math.random() * 6000
    ) {

        lightningTime =
            Date.now();

        ctx.fillStyle =
            "rgba(255,255,255,.18)";

        ctx.fillRect(
            0,
            0,
            window.innerWidth,
            window.innerHeight
        );

    }

}


/* ==========================================
   START
========================================== */

resizeCanvas();

draw();
