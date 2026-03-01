let renderGen;

function setup() {
    // make canvas that covers the entire window
    let cnv = createCanvas(windowWidth, windowHeight);
    cnv.position(0, 0);
    cnv.style('z-index', '-10'); // send canvas to back

    // get the current date

    let now = new Date();
    let day = now.getDate();
    let month = now.getMonth() + 1;

    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();

    let totalSeconds = hours * 3600 + minutes * 60 + seconds;
    let dayProgress = totalSeconds / 86400; // total seconds in a day

    if (month == 1) {
        // January
        let c = new Snowflakes(dayProgress);
        renderGen = c.render();
    } else if (month == 2) {
        // February
        let c = new Valentines(dayProgress);
        renderGen = c.render();
    } else if (month == 3) {
        // March
        let c = new Clovers(dayProgress);
        renderGen = c.render();
    } else if (month == 5) {
        let c = new Garden(dayProgress);
        renderGen = c.render();
    } else {
        background('red');
    }
}

function draw() {
    let val = renderGen.next();
    if (val.done) {
        noLoop();
    }
}

function getPositions(num, sizeRange, failThreshold = 1000) {
    let positions = [];
    let failedAttempts = 0;

    while (positions.length < num && failedAttempts < failThreshold) {
        let x = random(width);
        let y = random(height);
        let size = random(...sizeRange);

        // check for overlap with existing positions
        let overlapping = false;
        for (let pos of positions) {
            let d = dist(x, y, pos[0], pos[1]);
            if (d < (size + pos[2]) * 0.3) { // 0.6 is a spacing factor
                overlapping = true;
                break;
            }
        }

        if (!overlapping) {
            positions.push([x, y, size]);
        } else {
            failedAttempts++;
        }
    }

    return positions;
}

function gradientBackground(bgCols, accentCols) {
    for(let i = 0; i < 3; i++) {
        let randomDir = random() * TAU;

        let pos1 = [width/2 + cos(randomDir)*width*0.66, height/2 + sin(randomDir)*height*0.66];
        let pos2 = [width/2 + cos(randomDir + PI)*width*0.66, height/2 + sin(randomDir + PI)*height*0.66];

        let col1 = random(bgCols);
        let col2 = lerpColor(random(accentCols), color(0), random(0.25, 0.75));

        col1 = transCol(col1, random());
        col2 = transCol(col2, random());

        linearGradient(...pos1, ...pos2, col1, col2);
        noStroke();
        blendMode(random([BLEND, MULTIPLY, SCREEN, OVERLAY, HARD_LIGHT]));
        rect(0, 0, width, height);
    }
    blendMode(BLEND);
}

class Snowflakes {
    constructor(magic) {
        this.magic = magic;

        if (this.magic < 0.33 || this.magic > 0.75) {
            // Darker scheme
            this.bgCols = [
                color("#16476A"),
                color("#132440"),
                color("#452829"),
            ];
        } else {
            // Lighter scheme
            this.bgCols = [
                color("#A3CEF1"),
                color("#D4F1F9"),
                color("#F1E3D3"),
            ];
        }

        this.accentCols = [
            color("#EFECE3"),
            color("#C0C9EE"),
        ];
    
        push();
        colorMode(HSB);
        // add light pastel hues for all colors of rainbow to accents

        for (let h = 0; h < 360; h += 30) {
            let col = color(h, 30, 95);
            this.accentCols.push(col);
        }
        pop();


    }

    *renderSnowflake(x, y, size, col) {
        let symmetry = floor(random(5, 9));
        let rotation = random() * TAU;

        let n = noise(x * 0.002, y * 0.002);
        col = lerpColor(col, color(255), n);

        let coreSize = size * random(0.1, 0.3);
        let szRange = [min(width,height)*0.0015, min(width,height)*0.003];

        let totalYields = 0;
        let yieldSkipper = 3;
        let tryYield = () => {
            totalYields++;
            if (totalYields % yieldSkipper == 0) {
                return true;
            } else {
                return false;
            }
        }

        noStroke();
        // fill(transCol(col, 0.2));
        
        for(let i = 0; i < coreSize*40; i++) {
            let randA = random() * TAU;
            let randR = random() * coreSize;
            let cx = x + cos(randA) * randR;
            let cy = y + sin(randA) * randR;
            fill(transCol(col, random()));
            circle(cx, cy, random(...szRange));
           if (tryYield()) yield;
        }

        let extendCounts = (size - coreSize) / (min(width,height)*0.0005);

        for(let i = 0; i < extendCounts; i++) {
            let len = coreSize + (i / extendCounts) * (size - coreSize);
            // fill(col);
            for(let j = 0; j < symmetry; j++) {
                let angle = rotation + (j / symmetry) * TAU;
                let fx = x + cos(angle) * len + random(-size*0.02, size*0.02);
                let fy = y + sin(angle) * len + random(-size*0.02, size*0.02);
                fill(transCol(col, random()));
                circle(fx, fy, random(...szRange));
            }
            if (tryYield()) yield;
        }

        let symmObjectsCt = floor(random(3, 7));
        let symmObjects = [];
        for(let i = 0; i < symmObjectsCt; i++) {
            let type = random(["circle", "line", "line"]);
            let relPos = random(0.2, 0.9);
            let sz = random(size*0.05, size*0.35);
            let a = random() * TAU;
            symmObjects.push({type, relPos, sz, a});
        }

        for(let obj of symmObjects) {
            let startPos = coreSize + obj.relPos * (size - coreSize);

            for(let j = 0; j < symmetry; j++) {
                let angle = rotation + (j / symmetry) * TAU;
                let fx = x + cos(angle) * startPos;
                let fy = y + sin(angle) * startPos;
                fill(transCol(col, random()));

                if (obj.type == "circle") {
                    
                    for(let k = 0; k < 15 * obj.sz; k++) {
                        let randA = random() * TAU;
                        let randR = random() * obj.sz * 0.5;
                        let cx = fx + cos(randA) * randR;
                        let cy = fy + sin(randA) * randR;
                        fill(transCol(col, random()));
                        circle(cx, cy, random(...szRange));
                        if (tryYield()) yield;
                    }
                } else if (obj.type == "line") {
                    let a = angle + obj.a * TAU;
                    let endX = fx + cos(a) * obj.sz;
                    let endY = fy + sin(a) * obj.sz;
                   
                    for(let k = 0; k < obj.sz / (min(width,height)*0.00025); k++) {
                        let t = k / (obj.sz / (min(width,height)*0.0005));
                        let lx = lerp(fx, endX, t) + random(-obj.sz*0.1, obj.sz*0.1);
                        let ly = lerp(fy, endY, t) + random(-obj.sz*0.1, obj.sz*0.1);
                        fill(transCol(col, random()));
                        circle(lx, ly, random(...szRange));
                        if (tryYield()) yield;
                    }
                }
            }
        }   

        yield;
    }

    *render() {
        // First, do layered gradient background
        gradientBackground(this.bgCols, this.accentCols);
        yield;

        // Next, draw snowflakes
        let numFlakes = 300;
        let szRange = [min(width,height)*0.015, min(width,height)*0.05];
        let positions = [];
        let failedAttempts = 0;

        while (positions.length < numFlakes || failedAttempts < 1500) {
            let x = random(width);
            let y = random(height);
            let size = random(...szRange);

            // check for overlap with existing positions
            let overlapping = false;
            for (let pos of positions) {
                let d = dist(x, y, pos[0], pos[1]);
                if (d < (size + pos[2]) * 0.6) { // 0.6 is a spacing factor
                    overlapping = true;
                    break;
                }
            }

            if (!overlapping) {
                positions.push([x, y, size]);
            } else {
                failedAttempts++;
            }
        }

        let flakeGens = [];

        for (let i = 0; i < numFlakes; i++) {
            let [x, y, size] = positions[i];
            let col = random(this.accentCols);
            let flakeGen = this.renderSnowflake(x, y, size, col);
            flakeGens.push(flakeGen);
        }
        while (flakeGens.length > 0) {
            for (let gen of flakeGens) {
                gen.next();
            }
            flakeGens = flakeGens.filter(gen => !gen.next().done);

            yield;
        }

        yield;
    }
}

class Valentines {
    constructor(magic) {
        this.magic = magic;

        if (this.magic < 0.33 || this.magic > 0.75) {
            // Darker scheme
            this.bgCols = [
                color("#9c1212"),
                color("#d60000"),
                color("#452829"),
            ];
        } else {
            // Lighter scheme
            this.bgCols = [
                color("#ff257e"),
                color("#FFC5e6"),
                color("#EEEEEE"),
            ];
        }

        this.accentCols = [
            color("#fff2d8"),
            color("#fccdd3"),
            color("#fca2cf"),
            color("#d8f4f6"),
            color("#ade1eb"),
        ];
    
        this.shadowDir = random()*TAU;
    }

    *renderHeart(x, y, size) {
        let colMain = random(this.accentCols);
        let colThreads = random(this.accentCols);
        while(colThreads === colMain) colThreads = random(this.accentCols);
        
        let rotation = PI + random(-PI/12, PI/12); // rotate hearts a bit for more visual interest

        let heartVerts = [];
        let numVerts = 90;

        size *= 0.8

        for(let i = 0; i < numVerts; i++) {
            let t = i / numVerts;
            let angle = t * TAU;
            
            // Heart shape parametric equations
            let sx = 16 * pow(sin(angle), 3);
            let sy = 13 * cos(angle) - 5 * cos(2*angle) - 2 * cos(3*angle) - cos(4*angle);
            
            let r = size * 0.05;
            let vx = x + sx * r * cos(rotation) - sy * r * sin(rotation);
            let vy = y + sx * r * sin(rotation) + sy * r * cos(rotation);
            heartVerts.push([vx, vy]);
        }

        // draw heart
        noStroke();
        fill(colMain);
        beginShape();
        for (let v of heartVerts) {
            vertex(v[0], v[1]);
        }
        endShape(CLOSE);

        // between each vert, draw a 'thread' to make it look like knitted onto the background
        stroke(colThreads);
        strokeWeight(size * 0.04);
        noFill();

        drawingContext.shadowOffsetX = 0.001 * min(width, height) * cos(this.shadowDir);
        drawingContext.shadowOffsetY = 0.001 * min(width, height) * sin(this.shadowDir);
        
        let threadLen = size * 0.15;
        for(let i = 0; i < heartVerts.length; i += 2) {
            if(random() > 0.5) continue; // skip some threads for visual interest

            let v1 = heartVerts[i];
            let v2 = heartVerts[(i+1) % heartVerts.length];
            let mp = [(v1[0] + v2[0]) / 2, (v1[1] + v2[1]) / 2];

            let ang = atan2(v2[1] - v1[1], v2[0] - v1[0]) + PI/2;
            // ang += PI/2;

            let start = [mp[0] + cos(ang) * threadLen/2, mp[1] + sin(ang) * threadLen/2];
            let end = [mp[0] - cos(ang) * threadLen/2, mp[1] - sin(ang) * threadLen/2];

            let verts = [];
            let aOff = random()*TAU;
            for(let j = 0; j < 10; j++) {
                let t = j / 10;
                let p = lerpPos(start, end, t);
                let n = noise(p[0] * 0.05, p[1] * 0.05);
                let a = TAU*n+aOff;
                let r = size * 0.02;
                let vx = p[0] + cos(a) * r;
                let vy = p[1] + sin(a) * r;
                verts.push([vx, vy]);
            }

            beginShape();
            for(let v of verts) {
                vertex(v[0], v[1]);
            }
            endShape();
        }



        yield;
    }

    *render() {
        // First, do layered gradient background
        for(let i = 0; i < 3; i++) {

            let randomDir = random() * TAU;

            let pos1 = [width/2 + cos(randomDir)*width*0.66, height/2 + sin(randomDir)*height*0.66];
            let pos2 = [width/2 + cos(randomDir + PI)*width*0.66, height/2 + sin(randomDir + PI)*height*0.66];

            let col1 = random(this.bgCols);
            let col2 = lerpColor(random(this.accentCols), color(0), random(0.25, 0.75));

            col1 = transCol(col1, random());
            col2 = transCol(col2, random());

            linearGradient(...pos1, ...pos2, col1, col2);
            noStroke();
            blendMode(random([BLEND, MULTIPLY, SCREEN, OVERLAY, HARD_LIGHT]));
            rect(0, 0, width, height);
        }
        yield;
        blendMode(BLEND);

        // Next, draw hearts
        let numHearts = 200;
        let szRange = [min(width,height)*0.05, min(width,height)*0.15];
        let positions = getPositions(numHearts, szRange);

        // drawingContext.shadowOffsetX = 2;
        // drawingContext.shadowOffsetY = -2;
        drawingContext.shadowBlur = 5;
        drawingContext.shadowColor = lerpColor(random(this.accentCols), color(0), 0.75);
        let shadowOffsetRange = [0.005 * min(width, height), 0.025 * min(width, height)];

        for (let i = 0; i < numHearts; i++) {
            let t = i / numHearts;
            let offsetAmt = lerp(...shadowOffsetRange, t);
            drawingContext.shadowOffsetX = offsetAmt * cos(this.shadowDir);
            drawingContext.shadowOffsetY = offsetAmt * sin(this.shadowDir);

            let [x, y, size] = positions[i];
            let heartGen = this.renderHeart(x, y, size);

            // render it
            while (!heartGen.next().done) {
                // do nothing, just let it render over multiple frames
            }
            yield;
        }

        yield;
    }
}

class Clovers {
    constructor(dayProgress) {
        this.dayProgress = dayProgress;

        let ctr = [width/2, height/2 + (0.1 * height)];
        let solarRadius = sqrt(sq(width) + sq(height)) * 0.30;
        let angle = this.dayProgress * TAU + PI/2;

        this.sunPos = [ctr[0] + cos(angle)*solarRadius, ctr[1] + sin(angle)*solarRadius];
        this.dirToSun = atan2(this.sunPos[1] - ctr[1], this.sunPos[0] - ctr[0]);

        this.moonPos = [ctr[0] + cos(angle + PI)*solarRadius, ctr[1] + sin(angle + PI)*solarRadius];
        this.dirToMoon = atan2(this.moonPos[1] - ctr[1], this.moonPos[0] - ctr[0]);

        this.skyCols = {
            "day": [
                color("#c9fcfd"),
                color("#91fcff"),
                color("#00f9ff"),
            ],
            "night": [
                color("#1A1A2E"),
                color("#16213E"),
                color("#0F3460"),
            ],
            "transition": [
                color("#3D45AA"),
                color("#DA3D20"),
                color("#F8843F"),
                color("#FFF19B"),
            ]
        }

    }

    *render() {
        let bgCols;
        let skyGradX;
        let day = this.sunPos[1] < this.moonPos[1];
        if(day) {
            bgCols = this.skyCols.day;
            skyGradX = this.sunPos[0];
        } else {
            bgCols = this.skyCols.night;
            skyGradX = this.moonPos[0];
        }
        gradientBackground(bgCols, this.skyCols.transition);

        blendMode(HARD_LIGHT);

        let skyGrad = drawingContext.createRadialGradient(
            skyGradX, 2*height, height/2, skyGradX, 2*height, 2.2*height
        );

        if(day) {
            skyGrad.addColorStop(1, transCol(random(this.skyCols.day), random(0.50, 0.75)));
            skyGrad.addColorStop(random(0.75, 0.90), transCol(random(this.skyCols.day), random(0.50, 0.75)));
            skyGrad.addColorStop(random(0.25, 0.45), transCol(random(this.skyCols.night), random(0.50, 0.75)));
            skyGrad.addColorStop(0, transCol(random(this.skyCols.night), random(0.50, 0.75)));
        } else {
            skyGrad.addColorStop(1, transCol(random(this.skyCols.night), random(0.50, 0.75)));
            skyGrad.addColorStop(random(0.75, 0.90), transCol(random(this.skyCols.night), random(0.50, 0.75)));
            skyGrad.addColorStop(random(0.25, 0.45), transCol(random(this.skyCols.day), random(0.50, 0.75)));
            skyGrad.addColorStop(0, transCol(random(this.skyCols.day), random(0.50, 0.75)));
        }
        skyGrad.addColorStop(0.6, transCol(random(this.skyCols.transition), random(0.25, 0.50)));

        drawingContext.fillStyle = skyGrad;
        noStroke();
        rect(0, 0, width, height);

        if(day && random() < 0.5) {
            // Rainbow

            let rainbowCenter = [random(width), height*random(1, 1.5)];
            let rainbowSize = random(width, width*2);

            let rainbowGrad = drawingContext.createRadialGradient(
                ...rainbowCenter, rainbowSize*0.5, ...rainbowCenter, rainbowSize
            );

            colorMode(HSB);
            let rainbowCols = [];
            for (let h = 0; h < 360; h += 1) {
                let col = color(h, 50, 100);
                rainbowCols.push(col);
            }
            colorMode(RGB);
            
            let rainbowWidth = 0.1
            let rainbowCenterT = random(0.2, 0.4);
            let rainbowTRange = [rainbowCenterT - rainbowWidth/2, rainbowCenterT + rainbowWidth/2];

            for(let i = 0; i < rainbowCols.length; i++) {
                let col = rainbowCols[i];
                rainbowGrad.addColorStop(lerp(...rainbowTRange, i / rainbowCols.length), transCol(col, 0.5));
            }

            let randomSkyCol = transCol(day ? random(this.skyCols.day) : random(this.skyCols.night), 0);
            rainbowGrad.addColorStop(0, randomSkyCol);
            rainbowGrad.addColorStop(rainbowTRange[0] - 0.10, randomSkyCol);
            rainbowGrad.addColorStop(rainbowTRange[1] + 0.10, randomSkyCol);
            rainbowGrad.addColorStop(1, randomSkyCol);

            colorMode(OVERLAY);

            drawingContext.fillStyle = rainbowGrad;
            noStroke();
            rect(0, 0, width, height); 


        }

        
        let solarSize = min(width, height) * 0.1;

        let sunCol = color(255, 255, 200);
        fill(sunCol);
        circle(this.sunPos[0], this.sunPos[1], solarSize);

        let moonCol = color(200, 200, 255);
        fill(moonCol);
        circle(this.moonPos[0], this.moonPos[1], solarSize);
        
        
        radialGradient(...this.sunPos, solarSize*0.5, ...this.sunPos, solarSize, sunCol, transCol(sunCol, 0));
        rect(0, 0, width, height); 
        radialGradient(...this.moonPos, solarSize*0.5, ...this.moonPos, solarSize, moonCol, transCol(moonCol, 0));
        rect(0, 0, width, height); 


        let starT = map((this.dayProgress + 0.25)%1, 0, 0.5, 0, 1);
        let starAlpha = 0;
        if(starT < 0.1) {
            starAlpha = map(starT, 0, 0.1, 0, 1);
        } else if(starT > 0.9) {
            starAlpha = map(starT, 0.9, 1, 1, 0);
        } else {
            starAlpha = 1;
        }

        if (starAlpha > 0) {
            let positions = getPositions(200, [min(width,height)*0.002, min(width,height)*0.005]);
            for(let pos of positions) {
                let col = color(255, 255, 255, starAlpha * random(150, 255));
                fill(col);
                circle(pos[0], pos[1], random(1, 3));
            }
            yield;
        }
        blendMode(BLEND);


        this.terrainSlices = [];
        let sliceRes = 1;
        let sliceCt = ceil((height) / sliceRes);
        
        let terrRes = 2;
        let terrCt = ceil((width*1.2) / terrRes) + 1;

        for(let i = 0; i < sliceCt; i++) {
            let ti = i / sliceCt;
            let sliceY = lerp(2*height/3, height*2, ti);
            console.log(sliceY)
            let slice = [];
            for(let j = 0; j < terrCt; j++) {
                let tj = j / terrCt;

                let easeOut = (t) => 1 - pow(1-t, 3);

                let ntjRange = [0, 1];
                let ntjRangeOff = 5 * (1 - easeOut(ti));
                ntjRange[0] -= ntjRangeOff;
                ntjRange[1] += ntjRangeOff;

                let x = map(tj, 0, 1, -(width*0.1), (width*1.1));
                
                let nx = map(tj, 0, 1, ...ntjRange, true)
                let ny = easeOut(ti) * 5;
                // let n = noise(map(tj, 0, 1, ...ntjRange, true) * terrDetail, easeOut(ti) * terrDetail) ** 3;

                slice.push({
                    x: x,
                    y: sliceY,
                    sliceT: ti,
                    nx: nx,
                    ny: ny,
                    n: 0,
                });
            }
            this.terrainSlices.push(slice);
        }

        // Octave noise
        let nLayers = 5;
        let influence = 0.50;
        let seenNRange = [Infinity, -Infinity];
        for(let i = 0; i < nLayers; i++) {
            noiseSeed(round(random()*10000));
            let terrDetail = lerp(0.5, 2.5, i / nLayers);
            let exponent = random(2, 5);
            let offX = random() * 1000;
            let offY = random() * 1000;
        
            for(let slice of this.terrainSlices) {
                for(let pt of slice) {
                    let n = map(noise(pt.nx * terrDetail + offX, pt.ny * terrDetail + offY) ** exponent, 0, 1, -1, 1);
                    pt.n += n * influence;
                    if (pt.n < seenNRange[0]) seenNRange[0] = pt.n;
                    if (pt.n > seenNRange[1]) seenNRange[1] = pt.n;
                }
            }

            influence *= 0.5;
        }

        for(let slice of this.terrainSlices) {
            for(let pt of slice) {
                pt.n = map(pt.n, ...seenNRange, -1, 1);

            }
        }

        let shadowCol = lerpColor(random(this.skyCols.night), color(5), 0.25);

        let colGrass = color(50, 200, 50);

        let multedCol = color(
            red(colGrass) * red(shadowCol) / 255,
            green(colGrass) * green(shadowCol) / 255,
            blue(colGrass) * blue(shadowCol) / 255,
        );
        let screenedCol = color(
            red(colGrass) * 0.5 + red(day ? sunCol : moonCol) * 0.5,
            green(colGrass) * 0.5 + green(day ? sunCol : moonCol) * 0.5,
            blue(colGrass) * 0.5 + blue(day ? sunCol : moonCol) * 0.5,
        );

        if(!day) {
            // pre darken grass overall, and recompute darker multedCol
            colGrass = lerpColor(colGrass, multedCol, 0.25);
            multedCol = color(
                red(colGrass) * red(shadowCol) / 255,
                green(colGrass) * green(shadowCol) / 255,
                blue(colGrass) * blue(shadowCol) / 255,
            );
        }

        let heightVar = [-height*0.1, height*0.1];
        let heightVarTMult = 3;

        let grassHeightRange = [0.02 * min(width, height), 0.05 * min(width, height)];
        let lightTransitionT = 0.1;

        for(let slice of this.terrainSlices) {
            let heightVarT = heightVarTMult*map(slice[0].sliceT, 0, 1, 0.15, 1);

            push();
            fill(shadowCol);
            beginShape();
            for(let pt of slice) {
                pt.modY = pt.y + map(pt.n, 0, 1, ...heightVar) * heightVarT;
                vertex(pt.x, pt.modY);
            }
            vertex(width*1.2, height);
            vertex(-width*0.2, height);
            endShape(CLOSE);
            pop();

            for(let i = 1; i < slice.length - 1; i++) {
                let curr = slice[i];
                if(curr.x < -width*0.1 || curr.x > width*1.1) continue; // skip points outside of the main area for performance
                if(curr.modY > height*1.05) continue; // skip points that are too low for performance


                let prev = slice[i-1];
                let next = slice[i+1];

                // Get the normal of the terrain
                let terrainAngle = atan2(next.modY - prev.modY, next.x - prev.x);
                let normalAngle = terrainAngle - PI/2;

                let grassHeight = map(((curr.n+1)/2) + random(-0.1, 0.1), 0, 1, ...grassHeightRange);

                let grassAngle = lerp(normalAngle, -PI/2, random(0, 0.90));
                let grassPos = random() < 0.5 ? lerpPos([curr.x, curr.modY], [prev.x, prev.modY], random(0.1, 0.5)) : lerpPos([curr.x, curr.modY], [next.x, next.modY], random(0.1, 0.5));
                let grassBladeTop = [
                    grassPos[0] + cos(grassAngle) * grassHeight,
                    grassPos[1] + sin(grassAngle) * grassHeight
                ];
                let grassBladeLeft = [
                    grassPos[0] + cos(grassAngle + PI/2) * grassHeight * random(0.1, 0.2),
                    grassPos[1] + sin(grassAngle + PI/2) * grassHeight * random(0.1, 0.2),
                ];
                let grassBladeRight = [
                    grassPos[0] + cos(grassAngle - PI/2) * grassHeight * random(0.1, 0.2),
                    grassPos[1] + sin(grassAngle - PI/2) * grassHeight * random(0.1, 0.2),
                ];

                let col = wobbleHSB(colGrass, 0.05);
                let dot = day ? cos(this.dirToSun - normalAngle) : cos(this.dirToMoon - normalAngle);
                if(dot > 0) {
                    // Screen blend the grass color and sun color
                    let intensity = 0.20;
                    if(dot < lightTransitionT) intensity = map(dot, 0, lightTransitionT, 0, 0.20);
                    col = lerpColor(col, screenedCol, intensity);
                } else {
                    // Multiply blend the grass color and shadow color
                    let intensity = 0.20;
                    if(dot > -lightTransitionT) intensity = map(dot, -lightTransitionT, 0, 0.20, 0);
                    col = lerpColor(col, multedCol, intensity);
                }

                // Fog - lerp the grass color with the sky color based on the depth (sliceT)
                if(curr.sliceT < 0.25) {
                    let fogT = map(curr.sliceT, 0, 0.25, 0.5, 0);
                    let fogCol = day ? random(this.skyCols.day) : random(this.skyCols.night);
                    col = lerpColor(col, fogCol, fogT);
                }

                linearGradient(
                    curr.x, curr.modY, grassBladeTop[0], grassBladeTop[1],
                    shadowCol, col
                );

                // fill(col);
                
                beginShape();
                vertex(...grassBladeLeft);
                vertex(...grassBladeRight);
                vertex(...grassBladeTop);
                endShape(CLOSE);

                if(random() < 0.10) {
                    // make it a clover by adding circles at the top of the blade
                    let numCircles = random() < 0.90 ? 3 : 4;
                    let aOffset = random() * TAU;
                    let rT = random(0.05, 0.125);
                    for(let j = 0; j < numCircles; j++) {
                        let angle = aOffset + j * (TAU / numCircles) + random(-0.1, 0.1);
                        let cx = grassBladeTop[0] + cos(angle) * grassHeight * rT;
                        let cy = grassBladeTop[1] + sin(angle) * grassHeight * rT;
                        circle(cx, cy, grassHeight * (rT*2));
                    }

                }
                
            }
            yield;

            // for(let pt of slice) {
            //     if(pt.x < -width*0.1 || pt.x > width*1.1) continue; // skip points outside of the main area for performance
            //     if(pt.y > height*1.05) continue; // skip points that are too low for performance
            //     fill(wobbleCol(colGrass, 0.2));
            //     circle(pt.x, pt.y + map(pt.n, 0, 1, ...heightVar) * heightVarT, random(2, 5));
            // }
            // yield;

        }
    }

}

class Brush {
    constructor(nBristles) {
        this.nBristles = nBristles;
        this.resetOffsets();
    }

    resetOffsets() {
        this.bristleOffsets = [];
        for (let i = 0; i < this.nBristles; i++) {
            let offX = random(-1, 1);
            let offY = random(-1, 1);
            this.bristleOffsets.push([offX, offY]);
        }
    }

    getWeight(t, pressure = 0.5) {
        let wVal = 0;
        if (t <= 0.1) {
            wVal = -100 * (t - 0.1) * (t - 0.1) + 1;
        } else {
            wVal = -1.235 * (t - 0.1) * (t - 0.1) + 1;
        }
        wVal = constrain(wVal, 0.0, 1.0);

        wVal = lerp(wVal, 1.0, pressure);

        return wVal;
    }

    getShape(pts, size, pressure) {
        let shapeTop = [];
        let shapeBottom = [];

        let dens = 0.01 * min(width, height);
        let totalDist = 0;
        for (let i = 1; i < pts.length; i++) {
            totalDist += dist(pts[i-1][0], pts[i-1][1], pts[i][0], pts[i][1]);
        }
        let ct = ceil(totalDist / dens);

        shapeTop.push(pts[0]);

        for(let i = 1; i < ct; i++) {
            let t = i/ct;
            let idx_0 = floor(t * (pts.length - 1));
            let idx_1 = min(idx_0 + 1, pts.length - 1);
            let localT = (t * (pts.length - 1)) - idx_0;

            let x = lerp(pts[idx_0][0], pts[idx_1][0], localT);
            let y = lerp(pts[idx_0][1], pts[idx_1][1], localT);

            let angleBetween = atan2(pts[idx_1][1] - pts[idx_0][1], pts[idx_1][0] - pts[idx_0][0]);
            let angleLeft = angleBetween - PI/2;
            let angleRight = angleBetween + PI/2;

            let weight = this.getWeight(t, pressure);
            let localSize = size * weight;

            let topX = x + cos(angleLeft) * localSize * 0.5;
            let topY = y + sin(angleLeft) * localSize * 0.5;
            let bottomX = x + cos(angleRight) * localSize * 0.5;
            let bottomY = y + sin(angleRight) * localSize * 0.5;

            shapeTop.push([topX, topY]);
            shapeBottom.push([bottomX, bottomY]);
        }

        shapeTop.push(pts[pts.length - 1]);

        shapeBottom.reverse();
        let fullShape = shapeTop.concat(shapeBottom);
        return fullShape;
    }

    paint(pts, size, pressure, col, spread = 1.0) {
        this.bristleOffsets = shuffleArray(this.bristleOffsets);
        let shape = this.getShape(pts, size, pressure);

        let cols = [];
        let darkVer = [];
        let lightVer = [];
        colorMode(HSB);
        for(let i = 0; i < this.nBristles; i++) {
            let h = (hue(col) + random(-10, 10) + 360) % 360;
            let s = constrain(saturation(col) * random(0.9, 1.1), 0, 100);
            let b = constrain(brightness(col) * random(0.8, 1.2), 0, 100);
            let bristleCol = color(h, s, b);
            cols.push(bristleCol);

            darkVer.push(color(h, s, b * 0.90));
            lightVer.push(color(h, s * 0.5, min(b * 1.1, 100)));
        }    
        colorMode(RGB);

        noStroke();
        for (let i = 0; i < this.nBristles; i++) {
            let offX = this.bristleOffsets[i][0];
            let offY = this.bristleOffsets[i][1];

            let currShape = shape.map(p => [p[0] + offX*size*spread, p[1] + offY*size*spread]);
            
            fill(transCol(cols[i], random(0.20, 0.40)));
            beginShape();

            if (random() > 0.8) {
                strokeWeight(0.25);
                stroke(random([darkVer[i], lightVer[i]]));
            } else {
                noStroke();
            }

            for (let v of currShape) {
                vertex(v[0], v[1]);
            }
            endShape(CLOSE);
        }
    }


}

class Garden {
    constructor(magic) {
        this.magic = magic;
        this.brush = new Brush(10);


        this.cols = {
            "bg": color("#838261"),
        }


    }

    *renderCell(cell) {
        let center = cell.site;
        let n = noise(center.x * 0.01, center.y * 0.02);

        colorMode(RGB);
        let colOptions = [
            color("#8E8F72"),
            color("#76A49C"),
            color("#A0A782"),
            color("#9BA383"),
        ]


        let spiralPts = [];
        let ct = 30;
        let nEdges = cell.halfedges.length;
        for(let i = 0; i < ct; i++) {
            let t = i / ct;
            let edgePt = cell.halfedges[i%nEdges].getStartpoint();
            spiralPts.push([
                lerp(center.x, edgePt.x, t),
                lerp(center.y, edgePt.y, t)
            ]);
        }

        this.brush.paint(spiralPts, min(width, height)*0.02, 0.1, colOptions[floor(n*colOptions.length)], 0.5);

        yield;

        if (random() < 0.5) {
            // Grass dashes

            let grassCol = random(colOptions);
            let nDashes = floor(random(5, 15));
            
            let randPos = random(spiralPts);

            for(let i = 0; i < nDashes; i++) {
                

                let angle = random(TAU);
                let len = random(min(width, height)*0.01, min(width, height)*0.03);
                let dashPts = [];
                dashPts.push([
                    randPos[0] + cos(angle) * len * 0.1,
                    randPos[1] + sin(angle) * len * 0.1,
                ]);
                dashPts.push([
                    randPos[0] + cos(angle) * len,
                    randPos[1] + sin(angle) * len,
                ]);

                this.brush.paint(dashPts, min(width, height)*0.0025, 1.0, grassCol, 1.0);
            }

        }





        yield;
    }

    *render() {
        background(this.cols.bg);
        yield;

        // Setup voronoi tiles
        let numPts = 250;
        let pts = [];
        for(let i = 0; i < numPts; i++) {
            let x = random(-0.1, 1.1) * width;
            let y = random(-0.1, 1.1) * height;
            pts.push({x: x, y: y});
        }

        let voronoi = new Voronoi();
        let bbox = {xl: -width*0.1, xr: width*1.1, yt: -height*0.1, yb: height*1.1};
        let diagram = voronoi.compute(pts, bbox);

        let cellRenderers = [];
        for(let cell of diagram.cells) {
            let cellGen = this.renderCell(cell);
            cellRenderers.push(cellGen);
        }
        cellRenderers = shuffleArray(cellRenderers);

        for(let i = 0; i < cellRenderers.length; i++) {
            cellRenderers[i].next();
            if (i%4==0) yield;
        }
        yield;


        while (cellRenderers.length > 0) {
            for (let gen of cellRenderers) {
                gen.next();
            }
            cellRenderers = cellRenderers.filter(gen => !gen.next().done);
            yield;
        }

    }
}