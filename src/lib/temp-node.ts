import { Polygon } from './polygon';

const g_maxPolygonsInLeaf = 4;
const EPS_RAY_ENDS = 1;
const EPS_BOUNDING_BOX = 1;
const EPS_POLY_BOX_OVERLAP = 1;
const EPS_DISTANCE = 1e-5;
const EPS_ISECT_POLYGON = 1e-5;

export class TempNode{
	public m_children: TempNode[];
	public m_splitAxis: number;
	public m_splitPos: number;
	public m_polygons: Polygon[][];
	public m_numPolygons: number;

	constructor(m_splitAxis = -1, m_splitPos = 0, m_polygons = ([] as Polygon[][]), m_numPolygons = 0) {
		this.m_children = [] as TempNode[];
		this.m_splitAxis = m_splitAxis;
		this.m_splitPos = m_splitPos;
		this.m_polygons = m_polygons;
		this.m_numPolygons = m_numPolygons;
	}

}

class SortItem{
	public v: number;

	constructor() {

	}
}

