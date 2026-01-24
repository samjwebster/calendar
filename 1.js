let c;
let renderGen;

function setup() {
    createCanvas(1000, 1000);

    let p = getPalette();
    c = p.r();

    background(lerpColor(c, color(random([0, 255])), 0.75));

    let randPts = [];
    for (let i = 0; i < 2750; i++) {
        randPts.push([
            random(-1.2, 1.2) * width,
            random(-1.2, 1.2) * height
        ]);
    }

    let delaunay = Delaunator.from(randPts);
    let tris = [];
    for (let i = 0; i < delaunay.triangles.length; i += 3) {
        let p1 = randPts[delaunay.triangles[i]];
        let p2 = randPts[delaunay.triangles[i + 1]];
        let p3 = randPts[delaunay.triangles[i + 2]];

        tris.push([p1, p2, p3]);
    }

    let comp = new Composition(tris);
    renderGen = comp.render();
}

function draw() {
    let v = renderGen.next();
    if (v.done) {
        granulate(3);
        noLoop();
    }
}


class Composition {
    constructor(tris) {
        this.tris = tris;
    }

    *render() {
        let skipper = 100000;

        let inPct = random(0.20, 0.40);
        let nDetail = 0.0025;

        stroke(c);
        strokeWeight(0.0025 * width);
        strokeJoin(ROUND);
        fill(c);

        for (let i = 0; i < this.tris.length; i++) {
            if (i % skipper == 0) {
                yield;
            }

            let tri = this.tris[i];

            let center = [
                (tri[0][0] + tri[1][0] + tri[2][0]) / 3,
                (tri[0][1] + tri[1][1] + tri[2][1]) / 3
            ];

            let rightMost = 0;

            for (let j = 0; j < tri.length; j++) {
                

                let n = map(noise(tri[j][0] * nDetail, tri[j][1] * nDetail), 0.25, 0.75, 0, 1, true);

                tri[j] = lerpPos(tri[j], center, inPct + 0.25*n);

            }

            // noFill();
            // stroke(0);
            // strokeWeight(1);
            // beginShape();
            // vertex(tri[0][0], tri[0][1]);
            // vertex(tri[1][0], tri[1][1]);
            // vertex(tri[2][0], tri[2][1]);
            // endShape(CLOSE);

            let n = map(noise(center[0] * nDetail, center[1] * nDetail), 0.25, 0.75, 0, 1, true);

            tri[rightMost] = lerpPos(tri[rightMost], center, n);

            // noStroke();
            
            // fill(c);
            
            beginShape();
            vertex(tri[0][0], tri[0][1]);
            vertex(tri[1][0], tri[1][1]);
            vertex(tri[2][0], tri[2][1]);
            endShape(CLOSE);
        }
        yield;
    }
}