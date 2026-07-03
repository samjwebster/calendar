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
    } else if (month == 4) {
        // April
        let c = new Clouds(dayProgress);
        renderGen = c.render();
    } else if (month == 5) {
        let c = new Garden(dayProgress);
        renderGen = c.render();
    } else if (month == 6) {
        let c = new Fish(dayProgress);
        renderGen = c.render();
    } else if (month == 7) {
        let c = new Fireworks(dayProgress);
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

    renderSky() {
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
        }

        return [sunCol, moonCol];
    }

    *render() {
        let [sunCol, moonCol] = this.renderSky();
        yield;

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

class Clouds {
    constructor(dayProgress) {
        this.dayProgress = dayProgress;

        this.dayProgress = random(0.5, 0.7)

        let ctr = [width/2, height/2 + (0.1 * height)];
        let solarRadius = sqrt(sq(width) + sq(height)) * 0.25;
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

    renderSky() {
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
            let cols = shuffleArray([...this.skyCols.day]);
            for(let i = 0; i < cols.length; i++) {
                let col = cols[i];
                skyGrad.addColorStop(i/(cols.length-1), transCol(col, random(0.50, 0.75)));
            }

            // skyGrad.addColorStop(1, transCol(random(this.skyCols.day), random(0.50, 0.75)));
            // skyGrad.addColorStop(random(0.75, 0.90), transCol(random(this.skyCols.day), random(0.50, 0.75)));
            // skyGrad.addColorStop(random(0.25, 0.45), transCol(random(this.skyCols.night), random(0.50, 0.75)));
            // skyGrad.addColorStop(0, transCol(random(this.skyCols.night), random(0.50, 0.75)));
        } 
        // else {
        //     skyGrad.addColorStop(1, transCol(random(this.skyCols.night), random(0.50, 0.75)));
        //     skyGrad.addColorStop(random(0.75, 0.90), transCol(random(this.skyCols.night), random(0.50, 0.75)));
        //     skyGrad.addColorStop(random(0.25, 0.45), transCol(random(this.skyCols.day), random(0.50, 0.75)));
        //     skyGrad.addColorStop(0, transCol(random(this.skyCols.day), random(0.50, 0.75)));
        // }
        // skyGrad.addColorStop(0.6, transCol(random(this.skyCols.transition), random(0.25, 0.50)));

        drawingContext.fillStyle = skyGrad;
        noStroke();
        rect(0, 0, width, height);
        
        let solarSize = min(width, height) * 0.1;
        let sunCol = color(255, 255, 200);
        let moonCol = color(200, 200, 255);
        if(day) {
            fill(sunCol);
            circle(this.sunPos[0], this.sunPos[1], solarSize);
            radialGradient(...this.sunPos, solarSize*0.5, ...this.sunPos, solarSize, sunCol, transCol(sunCol, 0));
            rect(0, 0, width, height); 
        } else {
            fill(moonCol);
            circle(this.moonPos[0], this.moonPos[1], solarSize);
            radialGradient(...this.moonPos, solarSize*0.5, ...this.moonPos, solarSize, moonCol, transCol(moonCol, 0));
            rect(0, 0, width, height); 
        }

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
        }

        return [sunCol, moonCol];
    }

    *render() {
        let [sunCol, moonCol] = this.renderSky();
        yield;

        let sliceCt = 40;

        let zoomOutMod = 2.5;
        let cellRes = min(width, height) * 0.0125;
        let cellCtX = ceil(width / cellRes);
        let cellCtY = ceil(height / cellRes);

        // let cloudNoiseThreshold = 0.25;
        let threshRange = [0.20, 0.35];
        let cloudNoiseDetailX = width / min(width, height) * 1.5;
        let cloudNoiseDetailY = width / min(width, height) * 2.0;
        let cloudNoiseDetailZ = 7;

        let noiseOffsetX = random() * 1000;
        let noiseOffsetY = random() * 1000;

        let solarPos = day ? this.sunPos : this.moonPos;

        let allCells = [];
        let flockPosOptions = [];

        for(let i = 0; i < sliceCt; i++) {
            let t = i / sliceCt;
            let zoomLevel = lerp(1, zoomOutMod, 1 - t);
            let cells = [];
            // Generate cells
            for(let i = 0; i < cellCtX; i++) {
                cells.push([])
                let tx = lerp(i/(cellCtX-1), (i+1)/(cellCtX-1), random());
                let cartX = width * tx;
                let nx = lerp(-zoomLevel/2, zoomLevel/2, tx);
                for(let j = 0; j < cellCtY; j++) {
                    let ty = lerp(j/(cellCtY-1), (j+1)/(cellCtY-1), random());
                    let cartY = height * ty;
                    let ny = lerp(-zoomLevel/2, zoomLevel/2, ty);

                    let cloudNoiseThreshold = lerp(...threshRange, constrain(dist(nx, ny, 0, 0), 0 ,1) + random(-0.1, 0.1)); 

                    // let currDetailX = (sin(ty ) + 1) * cloudNoiseDetailX * 2;
                    // if(random() > 0.9) console.log(ty, currDetailX)

                    let n = noise(nx * cloudNoiseDetailX + noiseOffsetX, ny * cloudNoiseDetailY + noiseOffsetY, t*cloudNoiseDetailZ);
                    if(n < cloudNoiseThreshold) {
                        cells[i].push({x: cartX, y: cartY, n: n, t: t, nx: nx, ny: ny, onBottom: 0, onTop: 0, onLeft: 0, onRight: 0});

                        // if (t > 0) {
                        //     let distToSolar = dist(cartX, cartY, ...solarPos);
                        //     let distThreshold = random(0.8, 1.2) * t * 0.40 * min(width, height);
                        //     if(distToSolar < distThreshold) {
                        //         // Clear out the center area for better viewing
                        //         cells[i].push({empty: true});
                        //     } else {
                        //         cells[i].push({x: cartX, y: cartY, n: n, t: t, nx: nx, ny: ny, onBottom: 0, onTop: 0, onLeft: 0, onRight: 0});
                        //     }
                        // } else {
                        //     cells[i].push({x: cartX, y: cartY, n: n, t: t, nx: nx, ny: ny, onBottom: 0, onTop: 0, onLeft: 0, onRight: 0});
                        // }
                    } else {
                        cells[i].push({empty: true});
                        if(t > 0.2 && t < 0.8) flockPosOptions.push([cartX, cartY, t]);
                    }
                }
            }

            // Compute cell neighbor data
            for(let i = 0; i < cellCtX; i++) {
                for(let j = 0; j < cellCtY; j++) {
                    let cell = cells[i][j];
                    if(cell.empty == true) continue;

                    let numChecks = 5;

                    // On Bottom
                    let ctr = 0;
                    for(let k = 1; k <= numChecks; k++) {
                        let checkJ = j + k;
                        if(checkJ >= cellCtY) break;
                        if(cells[i][checkJ].empty) {
                            ctr++;
                        }
                    }
                    cell.onBottom = ctr / numChecks;

                    // On Top
                    ctr = 0;
                    for(let k = 1; k <= numChecks; k++) {
                        let checkJ = j - k;
                        if(checkJ < 0) break;
                        if(cells[i][checkJ].empty) {
                            ctr++;
                        }
                    }
                    cell.onTop = ctr / numChecks;

                    // On Right
                    ctr = 0;
                    for(let k = 1; k <= numChecks; k++) {
                        let checkI = i + k;
                        if(checkI >= cellCtX) break;
                        if(cells[checkI][j].empty) {
                            ctr++;
                        }
                    }
                    cell.onRight = ctr / numChecks;

                    // On Left
                    ctr = 0;
                    for(let k = 1; k <= numChecks; k++) {
                        let checkI = i - k;
                        if(checkI < 0) break;
                        if(cells[checkI][j].empty) {
                            ctr++;
                        }
                    }
                    cell.onLeft = ctr / numChecks;
                }
               
            }

            // Filter out empty cells and flatten
            cells = cells.flat().filter(c => !c.empty);

            allCells.push(cells);
        }

        let numFlocks = random([1, 2, 3]);
        let flocks = [];

        for(let i = 0; i < numFlocks; i++) {
            let randIdx = floor(random(flockPosOptions.length));
            let flockPos = flockPosOptions[randIdx];
            let flockT = flockPos[2];
            flockPos = [flockPos[0], flockPos[1]];
            flocks.push([flockPos, flockT]);

            // remove that index
            flockPosOptions[randIdx] = flockPosOptions[flockPosOptions.length - 1];
            flockPosOptions.pop();
        }
        flockPosOptions = []; // clear to save memory


        noiseSeed(random()*10000);

        noiseOffsetX = random() * 1000;
        noiseOffsetY = random() * 1000;
        cloudNoiseDetailX = 3;
        cloudNoiseDetailY = 4;

        // blendMode(HARD_LIGHT);

        // calculate cell cols
        colorMode(HSB);
        let cloudCol = color(random(200, 400)%360, 10, 70);
        let cloudShadowCol = random(this.skyCols.night);
        let bRange = [75, 90];

        let lightCol = day ? sunCol : moonCol;

        let edgeAffectThreshold = 0.75;
        
        for(let cells of allCells) {
            for(let cell of cells) {
                let colN = noise(cell.nx * cloudNoiseDetailX + noiseOffsetX, cell.ny * cloudNoiseDetailY + noiseOffsetY, cell.t * cloudNoiseDetailZ);
                
                colorMode(HSB);
                let col = color(hue(cloudCol), saturation(cloudCol), lerp(...bRange, colN));
                colorMode(RGB);

                // fog effect - further clouds slightly lerp towards sky
                col = lerpColor(col, random(day ? this.skyCols.day : this.skyCols.night), 0.50 * (1 - cell.t));

                let lightenAmt = 0;
                let darkenAmt = 0;

                if(cell.onTop > edgeAffectThreshold) {
                    if(cell.y > solarPos[1]) lightenAmt = max(lightenAmt, cell.onTop);
                    else darkenAmt = max(darkenAmt, cell.onTop);
                }

                if(cell.onBottom > edgeAffectThreshold) {
                    if(cell.y < solarPos[1]) lightenAmt = max(lightenAmt, cell.onBottom);
                    else darkenAmt = max(darkenAmt, cell.onBottom);
                }

                if(cell.onLeft > edgeAffectThreshold) {
                    if(cell.x > solarPos[0]) lightenAmt = max(lightenAmt, cell.onLeft);
                    else darkenAmt = max(darkenAmt, cell.onLeft);
                }

                if(cell.onRight > edgeAffectThreshold) {
                    if(cell.x < solarPos[0]) lightenAmt = max(lightenAmt, cell.onRight);
                    else darkenAmt = max(darkenAmt, cell.onRight);
                }

                colorMode(HSB);
                if(lightenAmt > 0 && darkenAmt == 0) {
                    let newBrightness = lerp(brightness(col), 100.0, (lightenAmt - edgeAffectThreshold)/(1-edgeAffectThreshold));
                    let pullHueSat = lerpColor(col, lightCol, 0.75 * (lightenAmt - edgeAffectThreshold)/(1-edgeAffectThreshold));
                    let newHue = hue(pullHueSat);
                    let newSat = saturation(pullHueSat);
                    col = color(newHue, newSat, newBrightness);
                    
                }
                if(darkenAmt > 0 && lightenAmt == 0) {
                    let newBrightness = brightness(col) * lerp(0.5, 1.0, 1 - ((darkenAmt - edgeAffectThreshold)/(1-edgeAffectThreshold)));
                    let pullHueSat = lerpColor(col, cloudShadowCol, 0.75 * (darkenAmt - edgeAffectThreshold)/(1-edgeAffectThreshold));
                    let newHue = hue(pullHueSat);
                    let newSat = saturation(pullHueSat);
                    col = color(newHue, newSat, newBrightness);
                    // (1 - lerp(...lightStrengthRange, darkenAmt));
                    // col = color(hue(col), saturation(col), newBrightness);
                }
                colorMode(RGB);

                cell.col = transCol(col, lerp(0.0125, 0.1, 1 - cell.t));
                // cell.col = col;
            }
        }

        colorMode(RGB);

        noiseSeed(random()*10000);

        // calculate cloud cell shapes and render
        noiseOffsetX = random() * 1000;
        noiseOffsetY = random() * 1000;
        cloudNoiseDetailX = 12;
        cloudNoiseDetailY = 12;
        cloudNoiseDetailZ = 10;

        let cloudMaxRRange = [min(width, height)*0.05, min(width, height)*0.20];

        let skipper = 100;
        let ctr = 0;

        blendMode(BLEND);


        // let flockCt = random(3, 8);
        // let flockRange = 0.05 * min(width, height);
        // let flockAngle = random([0, PI]) + random(-0.1, 0.1) * PI;

        flocks = flocks.sort((a, b) => a[1] - b[1]); // sort by t value so closer flocks are drawn last
        let nextFlockT = flocks[0][1];

        let birdSizeRange = [min(width, height)*0.0075, min(width, height)*0.015];        

        for(let cells of allCells) {
            if(cells[0].t >= nextFlockT) {
                let flock = flocks.shift();
                let flockPos = flock[0];
                let flockT = flock[1];
                nextFlockT = flocks.length > 0 ? flocks[0][1] : 2; // set to 2 to ensure no more flocks are drawn after this

                let flockCt = random(3, 8);
                let flockRange = 0.05 * min(width, height);
                let flockAngle = random([0, PI]) + random(-0.1, 0.1) * PI;

                // draw the flock of birds silhouettes
                for(let i = 0; i < flockCt; i++) {
                    let birdPos = [
                        flockPos[0] + random(-flockRange, flockRange),
                        flockPos[1] + random(-flockRange, flockRange),
                    ];

                    let birdSize = lerp(...birdSizeRange, flockT);

                    push();
                    translate(birdPos[0], birdPos[1]);
                    rotate(flockAngle + random(-0.1, 0.1));
                    fill(lerpColor(cloudShadowCol, color(10), random(0.50, 0.75)));
                    noStroke();


                    

                    let birdWidth = birdSize * random(0.125, 0.25);
                    let beakPos = [birdSize/2, 0];
                    let tailPos = [-birdSize/2, 0];
                    

                    let bezAnchor1 = lerpPos(beakPos, tailPos, random(0.10, 0.40));
                    bezAnchor1[0] += 0.50 * random(-birdWidth, birdWidth);
                    bezAnchor1[1] += 0.50 * random(-birdWidth, birdWidth);

                    let bezAnchor2 = lerpPos(beakPos, tailPos, random(0.60, 0.90));
                    bezAnchor2[0] += 0.50 * random(-birdWidth, birdWidth);
                    bezAnchor2[1] += 0.50 * random(-birdWidth, birdWidth);

                    let topEdge = [];
                    let bottomEdge = [];
                    let ct = 20;
                    for(let i = 0; i < ct; i++) {
                        let t = i / (ct - 1);
                        let x = bezierPoint(beakPos[0], bezAnchor1[0], bezAnchor2[0], tailPos[0], t);
                        let y = bezierPoint(beakPos[1], bezAnchor1[1], bezAnchor2[1], tailPos[1], t);
                        topEdge.push([x, y - birdWidth*0.5]);
                        bottomEdge.push([x, y + birdWidth*0.5]);
                    }

                    for(let i = 0; i < ct; i++) {
                        let t = i / (ct - 1);
                        if (t < 0.25) {
                            topEdge[i] = lerpPos(topEdge[i], beakPos, 1 - (t / 0.25));
                            bottomEdge[i] = lerpPos(bottomEdge[i], beakPos, 1 - (t / 0.25));
                        }
                        if (t > 0.75) {
                            topEdge[i] = lerpPos(topEdge[i], tailPos, (t - 0.75) / 0.25);
                            bottomEdge[i] = lerpPos(bottomEdge[i], tailPos, (t - 0.75) / 0.25);
                        }
                    }

                    beginShape();
                    for(let pt of topEdge) {
                        vertex(pt[0], pt[1]);
                    }
                    for(let i = bottomEdge.length - 1; i >= 0; i--) {
                        vertex(bottomEdge[i][0], bottomEdge[i][1]);
                    }
                    endShape(CLOSE);

                    let flapAmt = random() > 0.5 ? random(0, 0.33) : random(0.66, 1);
                    let wingStartA = lerpPos([0, 0], beakPos, random(0.25, 0.40));
                    let wingStartB = [wingStartA[0] - birdWidth, wingStartA[1]];
                    let wingEnd = [(wingStartA[0] + wingStartB[0])/2, lerp(-birdSize, birdSize, flapAmt)];

                    beginShape();
                    vertex(wingStartA[0], wingStartA[1]);
                    vertex(wingStartB[0], wingStartB[1]);
                    vertex(wingEnd[0], wingEnd[1]);
                    endShape(CLOSE);

                    wingEnd[0] += random(-birdWidth, birdWidth);
                    beginShape();
                    vertex(wingStartA[0], wingStartA[1]);
                    vertex(wingStartB[0], wingStartB[1]);
                    vertex(wingEnd[0], wingEnd[1]);
                    endShape(CLOSE);
                    pop();
                    

                }
            } 
            // let g = createGraphics(width, height);
            // g.noStroke();
            // let ctx = g.drawingContext;
            for(let cell of cells) {
                let polyPtCt = round(random(10, 20));
                let angleOffset = random(TAU);
                let angleStep = TAU / polyPtCt;
                let maxR = lerp(...cloudMaxRRange, cell.t);
                let polyPts = [];
                for(let i = 0; i < polyPtCt; i++) {
                    let angle = angleOffset + (i * angleStep) + random(-angleStep*0.25, angleStep*0.25);
                    
                    let nPt = [
                        cell.nx + cos(angle) * 0.1,
                        cell.ny + sin(angle) * 0.1,
                    ];
                    let nval = noise(nPt[0] * cloudNoiseDetailX + noiseOffsetX, nPt[1] * cloudNoiseDetailY + noiseOffsetY, cell.t * cloudNoiseDetailZ);
                    
                    let r = maxR * nval;
                    polyPts.push([
                        cell.x + cos(angle) * r,
                        cell.y + sin(angle) * r,
                    ]);
                }


                let edgeAngle = 0;
                if(cell.onTop) edgeAngle += PI/2 * cell.onTop;
                if(cell.onBottom) edgeAngle += -PI/2 * cell.onBottom;
                if(cell.onLeft) edgeAngle += PI * cell.onLeft;
                if(cell.onRight) edgeAngle += -PI * cell.onRight;
                edgeAngle = edgeAngle % TAU;

                let maxDist = 0;
                for(let i = 0; i < polyPtCt; i++) {
                    let d = dist(...polyPts[i], cell.x, cell.y);
                    if(d > maxDist) {
                        maxDist = d;
                    }
                }

                let gradStart = [
                    cell.x + cos(edgeAngle) * maxDist,
                    cell.y + sin(edgeAngle) * maxDist,
                ];
                let gradEnd = [
                    cell.x - cos(edgeAngle) * maxDist,
                    cell.y - sin(edgeAngle) * maxDist,
                ];


                // let getDist = (idx) => dist(...polyPts[idx], ...polyPts[(idx + floor(polyPtCt/2))%polyPtCt]);
                // let maxDistIdx = 0;
                // let maxDistFound = getDist(maxDistIdx);
                // for(let i = 1; i < polyPtCt/2; i++) {
                //     let d = getDist(i);
                //     if(d > maxDistFound) {
                //         maxDistFound = d;
                //         maxDistIdx = i;
                //     }
                // }
            
                let col = cell.col;
                let transparent_col = transCol(col, lerp(0, 0.0125, 1 - cell.t));
                // let transparent_col = transCol(col, 0);

                // Direct to canvas:
                linearGradient(...gradStart, ...gradEnd, col, transparent_col);
                beginShape();
                for(let pt of polyPts) {
                    vertex(pt[0], pt[1]);
                }
                endShape(CLOSE);


                // To graphics buffer
                // let gradient = ctx.createLinearGradient(
                //     gradStart[0], gradStart[1], gradEnd[0], gradEnd[1]
                // );
                // gradient.addColorStop(0, col);
                // gradient.addColorStop(1, transparent_col);
                // ctx.fillStyle = gradient;
                // g.beginShape();
                // for(let pt of polyPts) {
                //     g.vertex(pt[0], pt[1]);
                // }
                // g.endShape(CLOSE);

                ctr += 1;
                if(ctr % skipper == 0) {
                    yield;
                }
            }
            // image(g, 0, 0);
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

            if (random() > 0.9) {
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


        push();
        colorMode(HSB);
        this.cols = {
            "bg": color(random(360), 30, 30),
        }
        pop();

    }

    *renderCell(cell) {
        let center = cell.site;
        console.log(cell)
        let n = noise(center.x * 0.01, center.y * 0.02);

        let size_approx = 0;
        let sampleSizeCt = min(cell.halfedges.length, 10);
        for(let i = 0; i < sampleSizeCt; i++) {
            console.log(cell.halfedges[i].edge)
            let a = cell.halfedges[i].edge.lSite;
            let b = cell.halfedges[i].edge.rSite;
            if(a == null || b == null) {
                sampleSizeCt -= 1;
                continue;
            }
            let edgeDist = dist(a.x, a.y, b.x, b.y);
            size_approx += edgeDist;
        }

        size_approx = size_approx / sampleSizeCt;


        colorMode(RGB);
        let colOptions = [
            color("#2a5f2d"),
            color("#658436"),
            color("#9dae33"),
            color("#44580f"),
        ];
        let flowerColOptions = [
            color("#e49c9c"),
            color("#fbb26d"),
            color("#e15b64"),
            color("#fff8f0"),
            // color("#dff2e1"),
            color("#f6fe7d"),
            // color("#7e6ffd")
        ]


        let spiralPts = [];
        let ct = 25;
        let nEdges = cell.halfedges.length;
        for(let i = 0; i < ct; i++) {
            let t = i / ct;
            let edgePt = cell.halfedges[i%nEdges].getStartpoint();
            spiralPts.push([
                lerp(center.x, edgePt.x, t),
                lerp(center.y, edgePt.y, t)
            ]);
        }

        spiralPts = chaikin(spiralPts, 1);

        let c = random(colOptions);
        this.brush.paint(spiralPts, min(width, height)*0.03, 0.1, c, random(0.25, 0.375));

        if(random() > 0.25) {     
            colorMode(HSB);       
            c = color(hue(c), saturation(c), brightness(c) * 1.5);

            this.brush.paint(spiralPts, min(width, height)*0.02, 0.05, c, random(0.125, 0.25));



        }

        yield;


        let flowerChance = map(n, 0.1, 0.9, 0, 1, true) / 3;


        if (random() < flowerChance) {
            // Flowers

            if(center[0] < 0 || center[0] > width || center[1] < 0 || center[1] > height) {
                // if the center is out of bounds, skip the flower to avoid weird rendering issues
                return;
            }


            let flowerCol = random(flowerColOptions);
            let nPetals = floor(random(25, 50));
            
            let randPos = random(spiralPts);




            // let petalLenRange = [min(width, height)*0.03, min(width, height)*0.08];
            // let petalWidthRange = [min(width, height)*0.005, min(width, height)*0.015];

            let petalLenRange = [size_approx * 0.90, size_approx * 1.10];
            let petalWidthRange = [size_approx * 0.10, size_approx * 0.20];


            for(let i = 0; i < nPetals; i++) {
                
                let angle = (i/(nPetals-1)) * TAU + random(-0.1, 0.1) * TAU;

                let len = random(...petalLenRange);
                let dashPts = [];
                let start = [
                    randPos[0] + cos(angle) * len * 0.1,
                    randPos[1] + sin(angle) * len * 0.1,
                ];
                let end = [
                    randPos[0] + cos(angle) * len,
                    randPos[1] + sin(angle) * len,
                ];

                let res = 0.005 * min(width, height);
                let ct = ceil(len/res);

                for(let i = 0; i < ct; i++) {
                    let t = i / (ct -1);
                    let p = lerpPos(start, end, t);
                    let n = noise(p[0] * 0.01, p[1] * 0.01);
                    let offAngle = n* TAU;
                    p[0] += cos(offAngle) * res;
                    p[1] += sin(offAngle) * res;
                    dashPts.push(p);
                }

                this.brush.paint(dashPts, random(...petalWidthRange), 1.0, flowerCol, random(0.125, 0.25));
            }


            let flowerCenterCol = random([...colOptions, ...flowerColOptions]);

            let centerR = random(petalWidthRange);
            let centerPts = [];
            let centerCt = 30;
            // small spiral for flower center
            for(let i = 0; i < centerCt; i++) {
                let t = i / centerCt;
                centerPts.push([
                    randPos[0] + cos(t * TAU) * centerR * t,
                    randPos[1] + sin(t * TAU) * centerR * t,
                ]);
                
            }

            this.brush.paint(centerPts, centerR, 1.0, flowerCenterCol, random(0.125, 0.25));



        }





        yield;
    }

    *render() {
        background(this.cols.bg);
        yield;

        colorMode(HSB);

        // Setup voronoi tiles
        let pts = [];

        let cellRes = 0.075 * min(width, height);
        let cellCtX = ceil(width / cellRes);
        let cellCtY = ceil(height / cellRes);

        // grid based sampling
        for(let i = 0; i < cellCtX; i++) {
            let tx = lerp(i/(cellCtX-1), (i+1)/(cellCtX-1), random());
            let cartX = width * tx;
            for(let j = 0; j < cellCtY; j++) {
                let ty = lerp(j/(cellCtY-1), (j+1)/(cellCtY-1), random());
                let cartY = height * ty;
                pts.push({x: cartX, y: cartY});
            }
        }

        // let pts = [];
        // for(let i = 0; i < numPts; i++) {
        //     let x = random(-0.1, 1.1) * width;
        //     let y = random(-0.1, 1.1) * height;
        //     pts.push({x: x, y: y});
        // }

        let voronoi = new Voronoi();
        let bbox = {xl: -width*0.1, xr: width*1.1, yt: -height*0.1, yb: height*1.1};
        let diagram = voronoi.compute(pts, bbox);

        let cellRenderers = [];
        for(let cell of diagram.cells) {
            let cellGen = this.renderCell(cell);
            cellRenderers.push(cellGen);
        }
        cellRenderers = shuffleArray(cellRenderers);

        let skipper = 10;

        for(let i = 0; i < cellRenderers.length; i++) {
            cellRenderers[i].next();
            if (i%skipper==0) yield;
        }
        yield;


        let ctr = 0;
        while (cellRenderers.length > 0) {
            for (let gen of cellRenderers) {
                gen.next();
                ctr += 1;
                if(ctr % skipper == 0) yield;
            }
            cellRenderers = cellRenderers.filter(gen => !gen.next().done);
            yield;
        }

    }
}

class Fish {
    constructor(magic) {
        this.magic = magic;

        this.isDay = magic > 0.25 && magic < 0.75;
        this.bgCols = {
            "day": [ // bright aquatic
                color("#0f5e9c"),
                color("#2389da"),
                color("#1ca3ec"),
                color("#5abcd8"),
                color("#74ccf4")
            ],
            "night": [ // ocean, murkier
                color("#001a33"),
                color("#003366"),
                color("#004080"),
                color("#0059b3"),
                color("#0066cc")
            ]
        }


        this.fishCols = [];
        push();
        colorMode(HSB);
        for(let i = 0; i < 12; i++) {
            let h = i/12 * 360;
            this.fishCols.push(color(h, random(60, 80), random(70, 90)));
        }
        pop();

        this.generate();
    }

    renderBackground() {

        // horizontally spanning series of sine wave bands
        let colTop = this.isDay ? random(this.bgCols.day) : random(this.bgCols.night);
        let colBottom = colTop;
        while(colBottom === colTop) {
            colBottom = this.isDay ? random(this.bgCols.day) : random(this.bgCols.night);
        }

        let accent = random(this.fishCols);

        if(brightness(colBottom) > brightness(colTop)) {
            let temp = colTop;
            colTop = colBottom;
            colBottom = temp;
        }

        background(colTop);
        
        let bandSz = random(0.05, 0.15) * min(width, height);
        let bandCt = ceil(height / bandSz) + 1;

        let bands = [];

        for(let i = 0; i < bandCt; i++) {
            let y_bot = i * bandSz;
            let y_top = y_bot + bandSz;

            let band_bottom_edge = [];
            let band_top_edge = [];

            let xStep = 0.01 * min(width, height);
            for(let x = 0; x <= width; x += xStep) {
                let yOff = sin(x * 0.05) * bandSz * 0.25;
                band_bottom_edge.push([x, y_bot + yOff]);
                band_top_edge.push([x, y_top + yOff]);
            }

            bands.push({
                bottom_edge: band_bottom_edge,
                top_edge: band_top_edge,
            });
        }

        push();
        this.enableDropShadow();

        noStroke();

        // two passes - first odd then even
        for(let i = 0; i < bands.length; i++) {
            if(i % 2 == 0) continue;
            let band = bands[i];
            fill(
                lerpColor(
                    lerpColor(colTop, colBottom, i / bandCt),
                    accent, 0.05
                )
            );
            
            beginShape();
            for(let pt of band.bottom_edge) {
                vertex(pt[0], pt[1]);
            }
            for(let j = band.top_edge.length - 1; j >= 0; j--) {
                let pt = band.top_edge[j];
                vertex(pt[0], pt[1]);
            }
            endShape(CLOSE);
        }
        for(let i = 0; i < bands.length; i++) {
            if(i % 2 == 1) continue;
            let band = bands[i];
            fill(lerpColor(colTop, colBottom, i / bandCt));
            beginShape();
            for(let pt of band.bottom_edge) {
                vertex(pt[0], pt[1]);
            }
            for(let j = band.top_edge.length - 1; j >= 0; j--) {
                let pt = band.top_edge[j];
                vertex(pt[0], pt[1]);
            }
            endShape(CLOSE);    
        }

        this.disableDropShadow();
        pop();

    }

    generate() {

        let numFish = 200;
        this.fishSzRange = [min(width,height)*0.05, min(width,height)*0.15];
        this.fishPositions = getPositions(numFish, this.fishSzRange);
    }

    enableDropShadow() {
        drawingContext.shadowColor = color(0, 0, 0, 50);
        drawingContext.shadowOffsetX = 0.01 * min(width, height);
        drawingContext.shadowOffsetY = 0.01 * min(width, height);
        drawingContext.shadowBlur = 3; 
    }

    disableDropShadow() {
        drawingContext.shadowColor = 'transparent';
        drawingContext.shadowOffsetX = 0;
        drawingContext.shadowOffsetY = 0;
        drawingContext.shadowBlur = 0; 
    }

    renderFish(pos) {
        let n = noise(pos[0] * 0.005, pos[1] * 0.005);
        let a = lerp(0, TAU, n);
        let sz = random(...this.fishSzRange);

        let tail_t = random(0.80, 1.0);
        let tail_in_amt = random(0.05, 0.20);
        let body_t = random(0.5, 1.1);


        let eye_r = sz * random(0.05, 0.10);
        let pupil_t = random(0.25, 0.95);

        push();
        translate(pos[0], pos[1]);
        rotate(a);
        let bodyCol = random(this.fishCols);
        fill(bodyCol);
        // stroke(random(this.fishCols));
        // strokeWeight(0.0025 * min(width, height));
        noStroke();

        this.enableDropShadow();

        let fishPath = [
            [-sz/2, 0], // Nose
            [-sz/2 + sz*(tail_t/2), sz/4 * body_t], // Top main body
            [-sz/2 + sz*(tail_t), sz/4 * tail_in_amt], // end of body in, start of tail
            [sz/2, sz/4 * body_t], // top tail
            [sz/2, -sz/4 * body_t], // bottom tail
            [-sz/2 + sz*(tail_t), -sz/4 * tail_in_amt], // end of body in, start of tail
            [-sz/2 + sz*(tail_t/2), -sz/4 * body_t], // bottom main body
            [-sz/2, 0] // back to nose
        ];
        fishPath = chaikin(fishPath, 3, true);

        beginShape();
        for(let pt of fishPath) {
            vertex(pt[0], pt[1]);
        }
        endShape(CLOSE);

        this.disableDropShadow();

        fill(255);
        circle(-sz/4, 0, eye_r*2);

        fill(0);
        circle(-sz/4, 0, eye_r*2*pupil_t);


        noFill();
        let strokeCol = random(this.fishCols);
        strokeCol = lerpColor(strokeCol, bodyCol, 0.5);
        stroke(strokeCol);
        strokeWeight(0.0025 * min(width, height));
        beginShape();
        for(let pt of fishPath) {
            vertex(pt[0], pt[1]);
        }
        endShape(CLOSE);

        noStroke();

        
        pop();


    }

    *render() {
        this.renderBackground();
        yield;

        let skipper = 25;
        let ctr = 0;
        for(let pos of this.fishPositions) {
            this.renderFish(pos);
            ctr += 1;
            if (ctr % skipper == 0) {
                yield;
            }

            if(random() > 0.90) {
                // Bubble
                push();
                this.enableDropShadow();
                let tint = random(this.fishCols);
                let bubbleCol = lerpColor(color('white'), tint, 0.2);
                stroke(bubbleCol);
                fill(transCol(bubbleCol, 0.2));
                strokeWeight(0.0025 * min(width, height));
                let bubblePos = [
                    random() * width, random() * height
                ];
                circle(bubblePos[0], bubblePos[1], random(0.01, 0.05) * min(width, height));
                this.disableDropShadow();
                pop();
            }
        }
    }

}

class Fireworks {
    constructor(magic) {
        this.magic = magic;

        this.activeParticles = [];

        let numFireworks = 25;
        colorMode(HSB);
        for(let i = 0; i < numFireworks; i++) {
            let col = color(random() * 360, 90, 90);
            let pos = [random(0.05, 0.95) * width, random(0.05, 0.95) * height];

            let delay = random(100);
            let lifespan = random(50, 100);
            let type = random(["star", "star", "burst", "cloud"]);
            let radius = random(0.005, 0.01) * min(width, height);
            let speed = random(0.25, 0.75) * min(width, height) * 0.01;
            
            let numPoints = round(random(5, 12))
            let aOffset = random() * TAU;

            if(type == "cloud") {
                lifespan *= 0.5;
                speed *= 0.75;
                radius *= 3;
                numPoints *= 1.5;
            }

            if(type == "burst") {
                lifespan *= 0.33;
                speed *= 1.25,
                radius *= 0.8;
                numPoints *= 2;
            }

            for(let j = 0; j < numPoints; j++) {
                let a = aOffset + j/numPoints * TAU;
                let particle = {
                    "type": type,
                    "pos": [pos[0] + cos(a), pos[1] + sin(a)],
                    "vel": [cos(a) * speed, sin(a) * speed],
                    "acc": [0, 0.00005 * min(width, height)],
                    "col": col,
                    "delay": delay,
                    "lifespan": lifespan,
                    "maxLifespan": lifespan,
                    "radius": radius
                }
                this.activeParticles.push(particle);
            }
            
        }
    }

    *render() {
        let skyCol = color(random(["#040409","#050e39"]))
        background(skyCol);
        yield;

        // stars
        noStroke();
        let starCt = 750;
        for(let i = 0; i < starCt; i++) {
            fill(color(random()*360, 15, random(93, 99)));
            let r = random(0.001, 0.002) * min(width, height);
            circle(random() * width, random() * height, r);
        }
        

        colorMode(RGB);

        while(this.activeParticles.length > 0) {
            let newParticles = [];

            for(let particle of this.activeParticles) {
                if(particle.delay > 0) {
                    particle.delay -= 1;
                    newParticles.push(particle);
                    continue;
                }

                particle.pos[0] += particle.vel[0];
                particle.pos[1] += particle.vel[1];
                particle.vel[0] += particle.acc[0];
                particle.vel[1] += particle.acc[1];

                let lifeT = particle.lifespan / particle.maxLifespan;
                console.log(lifeT);


                let r = lifeT * random(0.5, 1.5) * particle.radius;
                
                if(particle.type == "burst") {
                    r = lifeT * random(0.80, 1.20) * particle.radius;
                }


                let colT = color(
                    red(particle.col),
                    green(particle.col),
                    blue(particle.col),
                    0
                )

                let maxAlpha = 175;
                if(particle.type == "cloud") maxAlpha = 75;
                if(particle.type == "burst") maxAlpha = 220;
                let whiteT = color(255, maxAlpha * lifeT);
                noStroke();

                if(particle.type == "star" || particle.type == "burst") {
                    radialGradient(...particle.pos, 0, ...particle.pos, r, whiteT, colT);
                    circle(particle.pos[0], particle.pos[1], r*2);
                } else if(particle.type == "cloud") {
                    let nSubPts = random(3, 6);
                    for(let i = 0; i < nSubPts; i++) {
                        let a = random() * TAU;
                        let subPos = [
                            particle.pos[0] + cos(a) * r * random(0.5, 1.0),
                            particle.pos[1] + sin(a) * r * random(0.5, 1.0)
                        ];
                        let subR = r * random(0.1, 0.25);
                        radialGradient(...subPos, 0, ...subPos, subR, whiteT, colT);
                        circle(subPos[0], subPos[1], subR*2);
                    }
                }
                
                particle.lifespan -= 1;
                if(particle.lifespan > 0) {
                    newParticles.push(particle);
                }
            }

            this.activeParticles = newParticles;
            yield;
        }
    }
}
