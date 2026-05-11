import { describe, expect, it } from 'vitest'
import { BrushPoint } from '../src/Point'

describe('BrushPoint', () => {
  it('Should be instantiatable with two coordinates', () => {
    const p = new BrushPoint(100, 50)

    expect(typeof p.x).toBe('number')
    expect(p.x).toBeCloseTo(100)

    expect(typeof p.y).toBe('number')
    expect(p.y).toBeCloseTo(50)
  })

  it('Should update coordinates correctly', () => {
    const p = new BrushPoint(10, 20)

    const pNew = new BrushPoint(500, 300)

    p.update(pNew)

    expect(p.x).toBeCloseTo(500)
    expect(p.y).toBeCloseTo(300)
  })

  it('Should move point by angle correctly', () => {
    const p = new BrushPoint(100, 100)

    // This equals 90° in radians
    const angle = Math.PI / 2

    p.moveByAngle(angle, 100)

    expect(p.x).toBeCloseTo(100)
    expect(p.y).toBeCloseTo(200)
  })

  it('Should compare equality to another point correctly', () => {
    const p = new BrushPoint(300, 300)

    const p1 = new BrushPoint(300, 300)
    const p2 = new BrushPoint(299, 300)
    const p3 = new BrushPoint(301, 300)
    const p4 = new BrushPoint(301, 299)
    const p5 = new BrushPoint(300, 300.000000000001)

    expect(p.equalsTo(p1)).toEqual(true)
    expect(p.equalsTo(p2)).toEqual(false)
    expect(p.equalsTo(p3)).toEqual(false)
    expect(p.equalsTo(p4)).toEqual(false)
    expect(p.equalsTo(p5)).toEqual(false)
  })

  it('Should calculate the difference between another point correctly', () => {
    const p1 = new BrushPoint(300, 300)
    const p2 = new BrushPoint(300, 600)

    const r = p1.getDifferenceTo(p2)

    expect(r.x).toEqual(0)
    expect(r.y).toEqual(-300)
  })

  it('Should calculate the distance to another point correctly', () => {
    const p1 = new BrushPoint(300, 300)
    const p2 = new BrushPoint(300, 600)

    const r = p1.getDistanceTo(p2)

    expect(r).toEqual(300)
  })

  it('Should calculate the angle to another point correctly', () => {
    const p1 = new BrushPoint(500, 500)
    const p2 = new BrushPoint(1000, 500)

    const r = p1.getAngleTo(p2)

    expect(r).toEqual(Math.PI)
  })

  it('Should return a coordinates object correctly', () => {
    const p = new BrushPoint(511.5932, 159.999994)

    const r = p.toObject()

    expect(typeof r).toBe('object')
    expect(r.x).toEqual(511.5932)
    expect(r.y).toEqual(159.999994)
  })
})