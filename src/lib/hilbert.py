import numpy as np

class Vector3:
    def __init__(self, x, y, z):
        self.x = x;
        self.y = y;
        self.z = z;


def hilbert3D(center=Vector3(0,0,0), size = 10, iterations = 1, v0 = 0, v1 = 1, v2 = 2, v3 = 3, v4 = 4, v5 = 5, v6 = 6, v7 = 7):
	# half = size / 2;
    # vec_s = np.array(1,2,3);
    half = size / 2
    vecs = np.array([
			Vector3(center.x - half, center.y + half, center.z - half),
			Vector3(center.x - half, center.y + half, center.z + half),
			Vector3(center.x - half, center.y - half, center.z + half),
			Vector3(center.x - half, center.y - half, center.z - half),
			Vector3(center.x + half, center.y - half, center.z - half),
			Vector3(center.x + half, center.y - half, center.z + half),
			Vector3(center.x + half, center.y + half, center.z + half),
			Vector3(center.x + half, center.y + half, center.z - half)
        ])
    vec = np.array([
		vecs[v0],
		vecs[v1],
		vecs[v2],
		vecs[v3],
		vecs[v4],
		vecs[v5],
		vecs[v6],
		vecs[v7]
  	])

    if(iterations-1>=0):
        iterations -= 1
        tmp = np.array([
			hilbert3D(vec[0], half, iterations, v0, v3, v4, v7, v6, v5, v2, v1),
			hilbert3D(vec[1], half, iterations, v0, v7, v6, v1, v2, v5, v4, v3),
			hilbert3D(vec[2], half, iterations, v0, v7, v6, v1, v2, v5, v4, v3),
			hilbert3D(vec[3], half, iterations, v2, v3, v0, v1, v6, v7, v4, v5),
			hilbert3D(vec[4], half, iterations, v2, v3, v0, v1, v6, v7, v4, v5),
			hilbert3D(vec[5], half, iterations, v4, v3, v2, v5, v6, v1, v0, v7),
			hilbert3D(vec[6], half, iterations, v4, v3, v2, v5, v6, v1, v0, v7),
			hilbert3D(vec[7], half, iterations, v6, v5, v2, v1, v0, v3, v4, v7),
		])
        return tmp

    return vec


pts = hilbert3D()

for sec in pts:
    for pt in sec:
        print(pt.x, pt.y, pt.z)
