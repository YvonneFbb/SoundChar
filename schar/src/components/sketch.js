'use client'

import React, { useRef, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const Sketch = dynamic(
  () =>
    import('react-p5').then(mod => {
      if (typeof window !== 'undefined' && !window.p5SoundLoaded) {
        require('p5/lib/addons/p5.sound')
        window.p5SoundLoaded = true // 标记只加载一次
      }
      return mod.default
    }),
  { ssr: false }
)

class Sampler {
  constructor (p5Inst, sampleInterval = 300) {
    this.mic = new window.p5.AudioIn()
    this.fft = new window.p5.FFT(0.8, 64)
    this.fft.setInput(this.mic)
    this.p5 = p5Inst

    this.sampleInterval = sampleInterval
    this.lastSampleTime = 0
    this.loudness = 0
    this.centroid = 0
    this.gate = 50
    this.active = false
  }

  async enable () {
    await this.p5.userStartAudio()
    await navigator.mediaDevices.getUserMedia({ audio: true })
    this.mic.start(() => {
      this.mic.amp(1)
    })
  }

  sample () {
    const currentTime = this.p5.millis()
    if (currentTime - this.lastSampleTime >= this.sampleInterval) {
      this.lastSampleTime = currentTime
      const spectrum = this.fft.analyze()

      this.loudness = this.fft.getEnergy('lowMid', 'highMid')
      this.centroid = this.fft.getCentroid()

      this.active = this.loudness > this.gate
    }
    return { loudness: this.loudness, centroid: this.centroid }
  }
}

const CharType = {
  BLOCK_W: 'BLOCK_W',
  BLOCK_H: 'BLOCK_H',
  BEZIER: 'BEZIER'
}

class CharCompo {
  constructor (points, mapfunc, type) {
    this.points = points
    this.mapfunc = mapfunc
    this.type = type
  }

  draw (p5Inst, wCenter, hCenter, loudness, centroid) {
    const { weight, smooth } = this.mapfunc(p5Inst, loudness, centroid)

    switch (this.type) {
      case CharType.BLOCK_W:
        p5Inst.fill(0)
        p5Inst.rect(
          this.points[0][0] + wCenter - 168,
          this.points[0][1] + hCenter - 200,
          this.points[1][0] - this.points[0][0] + weight,
          this.points[1][1] - this.points[0][1]
        )
        break
      case CharType.BLOCK_H:
        p5Inst.fill(0)
        p5Inst.rect(
          this.points[0][0] + wCenter - 168,
          this.points[0][1] + hCenter - 200,
          this.points[1][0] - this.points[0][0],
          this.points[1][1] - this.points[0][1] + weight
        )
        break
    }
  }
}

const LRControlButtons = ({ value, onIncrement, onDecrement }) => (
  <div>
    <div className='absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 flex z-10'>
      <button
        onClick={onDecrement}
        className='w-8 h-8 clip-triangle-left hover:bg-blue-600 bg-[#0c75ff]'
      />
    </div>

    <div className='absolute top-1/2 right-1/4 -translate-x-1/2 -translate-y-1/2 flex z-10'>
      <button
        onClick={onIncrement}
        className='w-8 h-8 clip-triangle-right hover:bg-blue-600 bg-[#0c75ff]'
      />
    </div>
  </div>
)

const MySketch = ({ className }) => {
  const [globalInt, setGlobalInt] = useState(0)
  const [audioAllowed, setAudioAllowed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const samplerRef = useRef()
  const globalIntRef = useRef(globalInt)

  const containerRef = useRef(null)
  const [canvasSize, setCanvasSize] = useState([800, 800])
  const canvasSizeRef = useRef(canvasSize)

  const handleResize = () => {
    const { width, height } = containerRef.current.getBoundingClientRect()
    setCanvasSize([width, height])
  }

  useEffect(() => {
    globalIntRef.current = globalInt
  }, [globalInt])
  useEffect(() => {
    canvasSizeRef.current = canvasSize
  }, [canvasSize])

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const setup = (p5Inst, canvasParentRef) => {
    const canvas = p5Inst.createCanvas(
      canvasSizeRef.current,
      canvasSizeRef.current
    )
    canvas.parent(canvasParentRef)
    samplerRef.current = new Sampler(p5Inst, 10)
    setIsLoading(false)

    p5Inst.getAudioContext().suspend()
  }

  const draw = p5Inst => {
    if (
      p5Inst.width !== canvasSizeRef.current[0] ||
      p5Inst.height !== canvasSizeRef.current[1]
    ) {
      p5Inst.resizeCanvas(canvasSizeRef.current[0], canvasSizeRef.current[1])
    }
    p5Inst.background(255)
    const data = samplerRef.current?.sample(p5Inst)
    if (!data) return

    qiData.forEach(char => {
      char.draw(
        p5Inst,
        p5Inst.width / 2,
        p5Inst.height / 2,
        data.loudness,
        data.centroid
      )
    })
  }

  return (
    <div ref={containerRef} className={`relative h-full w-full ${className}`}>
      {!isLoading && (
        <LRControlButtons
          value={globalInt}
          onIncrement={() => setGlobalInt(prev => prev + 1)}
          onDecrement={() => setGlobalInt(prev => prev - 1)}
        />
      )}

      {isLoading && (
        <div className='inset-0 bg-gray-100 flex items-center justify-center'>
          Loading audio...
        </div>
      )}

      {!isLoading && !audioAllowed && (
        <button
          className='absolute bottom-1/4 left-1/2 -translate-x-1/2 flex gap-8 z-10'
          onClick={async () => {
            await samplerRef.current?.enable()
            setAudioAllowed(true)
          }}
        >
          START
        </button>
      )}

      <Sketch setup={setup} draw={draw} />
    </div>
  )
}

let qiData = [
  new CharCompo(
    [
      [99.2074, 85.0394],
      [99.2074, 141.732]
    ],
    (p5Inst, loudness, centroid) => {
      let w = p5Inst.map(centroid, 0, 8000, 10, 30)

      return {
        weight: w,
        smooth: 3
      }
    },
    CharType.BLOCK_W
  ),
  new CharCompo(
    [
      [99.2074, 141.732],
      [240.02, 141.732]
    ],
    (p5Inst, loudness, centroid) => {
      let w = p5Inst.map(loudness, 0, 150, 2, 20)

      return {
        weight: w,
        smooth: 3
      }
    },
    CharType.BLOCK_H
  ),
  new CharCompo(
    [
      [99.2074, 184.252],
      [241.869, 184.252]
    ],
    (p5Inst, loudness, centroid) => {
      let w = p5Inst.map(loudness, 0, 150, 2, 20)

      return {
        weight: w,
        smooth: 3
      }
    },
    CharType.BLOCK_H
  ),
  new CharCompo(
    [
      [99.2074, 226.771],
      [240.95, 226.771]
    ],
    (p5Inst, loudness, centroid) => {
      let w = p5Inst.map(loudness, 0, 150, 2, 20)

      return {
        weight: w,
        smooth: 3
      }
    },
    CharType.BLOCK_H
  )
]

export default MySketch
