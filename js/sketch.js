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

    month = 1;
    day = 25;

    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();

    let totalSeconds = hours * 3600 + minutes * 60 + seconds;
    let dayProgress = totalSeconds / 86400; // total seconds in a day

    if (month == 1 || month == 2) {
        // January
        let c = new Snowflakes(dayProgress);
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

class Birthday {
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

    *renderBalloon(x, y, size, col) {

        let bottomAngle = PI/4;

        let balloonVerts = [];

        // balloon radius is 1.25 at the bottom angle, slight point where knot is
        let numVerts = 5



        // draw balloon
        noStroke();
        fill(transCol(col, 0.8));
        beginShape();
        for (let v of balloonVerts) {
            vertex(v[0], v[1]);
        }
        endShape(CLOSE);



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

        // Next, draw balloons
        let numBalloons = 100;
        let szRange = [min(width,height)*0.015, min(width,height)*0.05];
        let positions = [];
        let failedAttempts = 0;

        while (positions.length < numBalloons || failedAttempts < 1500) {
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

        let balloonGens = [];
        
        for (let i = 0; i < numBalloons; i++) {
            let [x, y, size] = positions[i];
            let col = random(this.accentCols);
            let balloonGen = this.renderBalloon(x, y, size, col);
            balloonGens.push(balloonGen);
        }

        while (balloonGens.length > 0) {
            for (let gen of balloonGens) {
                gen.next();
            }
            balloonGens = balloonGens.filter(gen => !gen.next().done);
            yield;
        }


        yield;
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