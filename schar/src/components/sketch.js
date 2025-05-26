'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { charData } from './chardata'
import { ENABLE_DEBUG, CANVAS_CONFIG, AUDIO_CONFIG, STYLES } from '@/constants'
import { PlayIcon, PauseIcon, DownloadIcon, LeftArrowIcon, RightArrowIcon } from '@/components/icons'
import { useMobile } from '@/hooks/useMobile'

/* For pic taking only */
let takePic = false
let cnt = 0
let lCnt = 0
let lCntMax = 18
let cCnt = 0
let cCntMax = 10

const Sketch = dynamic(
  () =>
    import('react-p5').then(mod => {
      if (typeof window !== 'undefined' && !window.p5SoundLoaded) {
        require('p5/lib/addons/p5.sound.min')
        window.p5SoundLoaded = true
      }
      return mod.default
    }),
  { ssr: false }
)

class Sampler {
  constructor(p5Inst, sampleInterval = AUDIO_CONFIG.sampleInterval) {
    this.mic = new window.p5.AudioIn()
    this.fft = new window.p5.FFT(AUDIO_CONFIG.fftSmoothness, AUDIO_CONFIG.fftBins)
    this.fft.setInput(this.mic)
    this.p5 = p5Inst
    this.sampleInterval = sampleInterval
    this.lastSampleTime = 0
    this.loudness = 0
    this.centroid = 0
  }

  async enable() {
    try {
      await this.p5.userStartAudio()
      await navigator.mediaDevices.getUserMedia({ audio: true })
      this.mic.start(() => {
        this.mic.amp(AUDIO_CONFIG.micAmp)
      })
      return true
    } catch (error) {
      console.error('无法启用音频:', error)
      return false
    }
  }

  async stop() {
    await this.p5.userStartAudio()
    await navigator.mediaDevices.getUserMedia({ audio: true })
    this.mic.stop()
  }

  sample() {
    const currentTime = this.p5.millis()
    if (currentTime - this.lastSampleTime >= this.sampleInterval) {
      this.lastSampleTime = currentTime
      this.fft.analyze()
      this.loudness = this.fft.getEnergy('lowMid', 'highMid')
      this.centroid = this.fft.getCentroid()
    }
    return { loudness: this.loudness, centroid: this.centroid }
  }
}

const LRControlButtons = ({ onIncrement, onDecrement }) => (
  <div>
    <div className='absolute top-1/2 left-8 md:left-32 -translate-x-1/2 -translate-y-1/2 z-10'>
      <button onClick={onDecrement}>
        <LeftArrowIcon className="w-8 h-8 md:w-10 md:h-10" />
      </button>
    </div>
    <div className='absolute top-1/2 right-4 md:right-24 -translate-x-1/2 -translate-y-1/2 z-10'>
      <button onClick={onIncrement}>
        <RightArrowIcon className="w-8 h-8 md:w-10 md:h-10" />
      </button>
    </div>
  </div>
)

const MySketch = ({ className, currentCharIndex = 0 }) => {
  const [globalInt, setGlobalInt] = useState(currentCharIndex)
  const [audioAllowed, setAudioAllowed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [canvasSize, setCanvasSize] = useState(CANVAS_CONFIG.defaultSize)
  const [colorOn, setColorOn] = useState(false)
  const [canvasRef, setCanvasRef] = useState(null)
  
  // 调试控制状态
  const [manualMode, setManualMode] = useState(false)
  const [manualLoudness, setManualLoudness] = useState(50)
  const [manualCentroid, setManualCentroid] = useState(3000)

  const samplerRef = useRef()
  const globalIntRef = useRef(globalInt)
  const containerRef = useRef(null)
  const canvasSizeRef = useRef(canvasSize)
  const resizeTimeoutId = useRef(null)
  const isMobile = useMobile()

  const handleResize = useCallback(() => {
    if (resizeTimeoutId.current) clearTimeout(resizeTimeoutId.current)
    resizeTimeoutId.current = setTimeout(() => {
      const { width, height } = containerRef.current.getBoundingClientRect()
      setCanvasSize([width, height])
      resizeTimeoutId.current = null
    }, 100)
  }, [])

  // Effects
  useEffect(() => {
    globalIntRef.current = globalInt
  }, [globalInt])

  useEffect(() => {
    canvasSizeRef.current = canvasSize
  }, [canvasSize])

  useEffect(() => {
    setGlobalInt(currentCharIndex)
  }, [currentCharIndex])

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeTimeoutId.current) clearTimeout(resizeTimeoutId.current)
    }
  }, [])

  // P5.js functions
  const setup = (p5Inst, canvasParentRef) => {
    const canvas = p5Inst
      .createCanvas(canvasSizeRef.current, canvasSizeRef.current)
      .parent(canvasParentRef)
    samplerRef.current = new Sampler(p5Inst)
    setCanvasRef(p5Inst)
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
    
    const finalData = {
      loudness: manualMode ? manualLoudness : (data?.loudness || 0),
      centroid: manualMode ? manualCentroid : (data?.centroid || 0)
    }

    if (takePic && audioAllowed && lCnt <= lCntMax && cCnt <= cCntMax) {
      finalData.centroid = cCnt * 1000
      finalData.loudness = lCnt * 10
      cnt += 1
    }

    charData[globalIntRef.current].draw(
      p5Inst,
      [
        canvasSizeRef.current[0] / CANVAS_CONFIG.gridSize,
        canvasSizeRef.current[1] / CANVAS_CONFIG.gridSize,
        CANVAS_CONFIG.gridSize
      ],
      finalData.loudness,
      finalData.centroid,
      colorOn
    )

    if (takePic && cnt >= 15) {
      if (audioAllowed && lCnt <= lCntMax && cCnt <= cCntMax) {
        p5Inst.saveCanvas(
          'myCanvas' + '-' + finalData.centroid + '-' + finalData.loudness,
          'png'
        )
      }
      cnt = 0
      lCnt += 1
      if (lCnt > lCntMax) {
        cCnt += 1
        lCnt = 0
      }
    }
  }

  const saveCurrentCanvas = () => {
    if (canvasRef) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `SoundChar-${charData[globalInt].name}-${timestamp}`
      canvasRef.saveCanvas(filename, 'png')
    }
  }

  const toggleAudio = async () => {
    if (!audioAllowed) {
      await samplerRef.current?.enable()
      setAudioAllowed(true)
    } else {
      samplerRef.current?.mic.stop()
      setAudioAllowed(false)
    }
  }

  return (
    <div ref={containerRef} className={`relative h-full w-full ${className}`}>
      {/* 桌面端左右切换按钮 */}
      {!isLoading && !isMobile && (
        <LRControlButtons
          onIncrement={() => setGlobalInt(prev => prev >= charData.length - 1 ? prev : prev + 1)}
          onDecrement={() => setGlobalInt(prev => prev < 1 ? prev : prev - 1)}
        />
      )}

      {isLoading && (
        <div className='inset-0 bg-gray-100 flex items-center justify-center'>
          Loading audio...
        </div>
      )}

      {/* 颜色切换按钮 */}
      {!isLoading && (
        <div className={`${isMobile ? 'absolute top-16 right-6' : 'fixed top-[80px] right-4 transform -translate-y-1/2'} z-10`}>
          <div
            onClick={() => setColorOn(!colorOn)}
            className='relative w-7 h-4 md:w-8 md:h-5 flex items-center rounded-full p-1 cursor-pointer overflow-hidden border-[1px] border-black'
          >
            <div className={`absolute inset-0 transition-opacity ${colorOn ? 'opacity-100 bg-gradient-to-tr from-[#0c75ff] to-[#f6c7ac]' : 'opacity-0 bg-gradient-to-tr from-[#0c75ff] to-[#f6c7ac]'}`} />
            <div className={`absolute inset-0 transition-opacity bg-black ${colorOn ? 'opacity-0' : 'opacity-100'}`} />
            <div className={`relative bg-white w-3 h-3 md:w-4 md:h-4 rounded-full shadow-md transform transition-transform ${colorOn ? 'translate-x-[8px] md:translate-x-[9px]' : 'translate-x-[-3px]'}`} />
          </div>
        </div>
      )}

      {/* 字符名称显示 */}
      {!isLoading && (
        <div className={`${STYLES.centerText} top-16 md:top-20 z-10 ${STYLES.songFont} text-center`}>
          <p className="text-xl md:text-2xl font-bold mb-1">
            {charData[globalInt].name}
          </p>
          {charData[globalInt].pinyin && (
            <p className="text-sm md:text-base text-gray-600 font-bold">
              {charData[globalInt].pinyin}
            </p>
          )}
        </div>
      )}

      {/* 调试控件 */}
      {!isLoading && ENABLE_DEBUG && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-80 p-3 rounded-lg shadow-md z-20 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="manualMode" 
              checked={manualMode} 
              onChange={(e) => setManualMode(e.target.checked)}
            />
            <label htmlFor="manualMode" className="text-sm font-medium">调试模式</label>
          </div>
          
          {manualMode && (
            <>
              <div className="flex items-center gap-2">
                <label htmlFor="loudness" className="text-sm w-16">响度:</label>
                <input
                  type="range"
                  id="loudness"
                  min="0"
                  max="180"
                  value={manualLoudness}
                  onChange={(e) => setManualLoudness(Number(e.target.value))}
                  className="w-40"
                />
                <span className="text-xs w-8">{manualLoudness}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <label htmlFor="centroid" className="text-sm w-16">中心频率:</label>
                <input
                  type="range"
                  id="centroid"
                  min="0"
                  max="9000"
                  step="100"
                  value={manualCentroid}
                  onChange={(e) => setManualCentroid(Number(e.target.value))}
                  className="w-40"
                />
                <span className="text-xs w-8">{manualCentroid}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* 控制按钮 */}
      {!isLoading && (
        <div className={`${STYLES.centerText} translate-y-8 ${isMobile ? 'flex gap-8' : 'flex justify-center'} z-10`} style={{ bottom: '20%' }}>
          <button className={STYLES.button} onClick={toggleAudio}>
            {audioAllowed ? <PauseIcon /> : <PlayIcon />}
          </button>
          
          {/* 下载按钮仅在移动端显示 */}
          {isMobile && (
          <button className={STYLES.button} onClick={saveCurrentCanvas}>
            <DownloadIcon />
          </button>
          )}
        </div>
      )}

      <Sketch setup={setup} draw={draw} />
    </div>
  )
}

export default MySketch 