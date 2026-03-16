import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  appendInterpolatedPoints,
  clampPoint,
  createNormalizedRect,
  exportComposite,
  fitWithinBox,
  loadImageAsset,
  renderComposite,
  supportsCanvasBlur
} from './lib/editor'
import { createTranslator, DEFAULT_LANGUAGE, LANGUAGE_OPTIONS } from './lib/i18n'

const SUPPORTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const LANGUAGE_STORAGE_KEY = 'image-blur-editor-language'
const THEME_STORAGE_KEY = 'image-blur-editor-theme'
const THEME_OPTIONS = [
  { value: 'light', labelKey: 'theme.options.light' },
  { value: 'dark', labelKey: 'theme.options.dark' }
]

function getStoredLanguage() {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE
  }

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return stored === 'en' || stored === 'ko' ? stored : DEFAULT_LANGUAGE
}

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)

  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function App() {
  const canvasRef = useRef(null)
  const stageRef = useRef(null)
  const fileInputRef = useRef(null)
  const draftActionRef = useRef(null)
  const pointerStateRef = useRef({
    drawing: false,
    pointerId: null
  })
  const variantCacheRef = useRef(new Map())

  const [language, setLanguage] = useState(getStoredLanguage)
  const [theme, setTheme] = useState(getInitialTheme)
  const [imageAsset, setImageAsset] = useState(null)
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })
  const [viewSize, setViewSize] = useState({ width: 0, height: 0 })
  const [tool, setTool] = useState('brush')
  const [effect, setEffect] = useState('blur')
  const [blurStyle, setBlurStyle] = useState('smooth')
  const [brushSize, setBrushSize] = useState(32)
  const [smoothStrength, setSmoothStrength] = useState(16)
  const [pixelateStrength, setPixelateStrength] = useState(18)
  const [redactOpacity, setRedactOpacity] = useState(100)
  const [redactColor, setRedactColor] = useState('#111111')
  const [actions, setActions] = useState([])
  const [redoStack, setRedoStack] = useState([])
  const [draftAction, setDraftAction] = useState(null)
  const [hoverPoint, setHoverPoint] = useState(null)
  const [statusMessage, setStatusMessage] = useState({ type: 'ready' })
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const t = createTranslator(language)
  const blurSupported = supportsCanvasBlur()

  const toolOptions = [
    {
      value: 'brush',
      label: t('tool.brush.label'),
      hotkey: 'B',
      summary: t('tool.brush.summary')
    },
    {
      value: 'rectangle',
      label: t('tool.rectangle.label'),
      hotkey: 'R',
      summary: t('tool.rectangle.summary')
    }
  ]

  const effectOptions = [
    {
      value: 'blur',
      label: t('effect.blur.label'),
      summary: t('effect.blur.summary'),
      caution: t('effect.blur.caution')
    },
    {
      value: 'pixelate',
      label: t('effect.pixelate.label'),
      summary: t('effect.pixelate.summary'),
      caution: t('effect.pixelate.caution')
    }
  ]

  const blurStyleOptions = [
    {
      value: 'smooth',
      label: t('blurStyle.smooth.label'),
      summary: t('blurStyle.smooth.summary')
    },
    {
      value: 'solid',
      label: t('blurStyle.solid.label'),
      summary: t('blurStyle.solid.summary')
    }
  ]

  useLayoutEffect(() => {
    if (!stageRef.current) {
      return undefined
    }

    const element = stageRef.current
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) {
        return
      }

      const nextWidth = Math.max(280, Math.floor(entry.contentRect.width - 32))
      const nextHeight = Math.max(320, Math.floor(entry.contentRect.height - 32))
      setStageSize({ width: nextWidth, height: nextHeight })
    })

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!imageAsset || !stageSize.width || !stageSize.height) {
      setViewSize({ width: 0, height: 0 })
      return
    }

    setViewSize(
      fitWithinBox(
        imageAsset.width,
        imageAsset.height,
        stageSize.width,
        stageSize.height
      )
    )
  }, [imageAsset, stageSize])

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    document.title = t('meta.title')
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [language, theme])

  useEffect(() => {
    if (!blurSupported && effect === 'blur' && blurStyle === 'smooth') {
      setBlurStyle('solid')
      setStatusMessage({ type: 'blurFallback' })
    }
  }, [blurSupported, effect, blurStyle])

  useEffect(() => {
    if (!imageAsset || !canvasRef.current || !viewSize.width || !viewSize.height) {
      return
    }

    renderComposite({
      targetCanvas: canvasRef.current,
      sourceCanvas: imageAsset.sourceCanvas,
      actions,
      draftAction,
      width: viewSize.width,
      height: viewSize.height,
      variantCache: variantCacheRef.current,
      hoverPoint,
      hoverBrushSize: brushSize,
      hoverTool: tool
    })
  }, [imageAsset, actions, draftAction, hoverPoint, brushSize, tool, viewSize])

  useEffect(() => {
    function handleWindowKeydown(event) {
      if (!imageAsset) {
        return
      }

      const key = event.key.toLowerCase()

      if (event.ctrlKey && key === 'z' && !event.shiftKey) {
        event.preventDefault()
        handleUndo()
        return
      }

      if ((event.ctrlKey && key === 'y') || (event.ctrlKey && event.shiftKey && key === 'z')) {
        event.preventDefault()
        handleRedo()
        return
      }

      if (key === '[') {
        event.preventDefault()
        setBrushSize((previous) => Math.max(4, previous - 4))
        return
      }

      if (key === ']') {
        event.preventDefault()
        setBrushSize((previous) => Math.min(180, previous + 4))
        return
      }

      if (key === 'b') {
        event.preventDefault()
        setTool('brush')
        return
      }

      if (key === 'r') {
        event.preventDefault()
        setTool('rectangle')
        return
      }

      if (key === '1') {
        event.preventDefault()
        setEffect('blur')
        setBlurStyle(blurSupported ? 'smooth' : 'solid')
        return
      }

      if (key === '2') {
        event.preventDefault()
        setEffect('pixelate')
        return
      }

      if (key === '3') {
        event.preventDefault()
        setEffect('blur')
        setBlurStyle('solid')
        return
      }

      if (key === 'escape' && pointerStateRef.current.drawing) {
        event.preventDefault()
        pointerStateRef.current = { drawing: false, pointerId: null }
        syncDraftAction(null)
        setStatusMessage({ type: 'dragCanceled' })
      }
    }

    window.addEventListener('keydown', handleWindowKeydown)
    return () => window.removeEventListener('keydown', handleWindowKeydown)
  }, [blurSupported, imageAsset])

  function getNamedEffectLabel(effectValue, blurStyleValue) {
    if (effectValue === 'pixelate') {
      return t('namedEffect.pixelate')
    }

    return blurStyleValue === 'solid'
      ? t('namedEffect.solidFill')
      : t('namedEffect.smoothBlur')
  }

  function getCurrentStrength(effectValue = effect, blurStyleValue = blurStyle) {
    if (effectValue === 'blur' && blurStyleValue === 'smooth') {
      return smoothStrength
    }

    if (effectValue === 'pixelate') {
      return pixelateStrength
    }

    return redactOpacity
  }

  function getCurrentStrengthLabel(effectValue = effect, blurStyleValue = blurStyle) {
    const value = getCurrentStrength(effectValue, blurStyleValue)

    if (effectValue === 'blur' && blurStyleValue === 'smooth') {
      return t('misc.blurStrength', { value })
    }

    if (effectValue === 'pixelate') {
      return t('misc.blockStrength', { value })
    }

    return t('misc.fillStrength', { value })
  }

  function getCurrentEffectLabel(effectValue = effect, blurStyleValue = blurStyle) {
    if (effectValue === 'blur') {
      return `${t('effect.blur.label')} / ${t(`blurStyle.${blurStyleValue}.label`)}`
    }

    return t('effect.pixelate.label')
  }

  function getStatusText(message) {
    switch (message.type) {
      case 'blurFallback':
        return t('status.blurFallback')
      case 'dragCanceled':
        return t('status.dragCanceled')
      case 'loadingImage':
        return t('status.loadingImage')
      case 'fileLoaded':
        return t('status.fileLoaded', message)
      case 'loadFailed':
        return t('status.loadFailed')
      case 'actionApplied':
        return t(`status.actionApplied.${message.tool}`, {
          effect: getNamedEffectLabel(message.effect, message.blurStyle)
        })
      case 'undo':
        return t('status.undo')
      case 'redo':
        return t('status.redo')
      case 'reset':
        return t('status.reset')
      case 'exporting':
        return t('status.exporting')
      case 'downloadReady':
        return t('status.downloadReady', message)
      case 'downloadFailed':
        return t('status.downloadFailed')
      case 'ready':
      default:
        return t('status.ready')
    }
  }

  function getCanvasPoint(event) {
    if (!canvasRef.current || !imageAsset || !viewSize.width || !viewSize.height) {
      return null
    }

    const rect = canvasRef.current.getBoundingClientRect()
    const offsetX = ((event.clientX - rect.left) / rect.width) * viewSize.width
    const offsetY = ((event.clientY - rect.top) / rect.height) * viewSize.height

    return clampPoint(
      {
        x: (offsetX / viewSize.width) * imageAsset.width,
        y: (offsetY / viewSize.height) * imageAsset.height
      },
      imageAsset.width,
      imageAsset.height
    )
  }

  function buildActionBase() {
    return {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      tool,
      effect,
      blurStyle,
      strength: getCurrentStrength(),
      brushSize,
      color: redactColor,
      opacity: redactOpacity
    }
  }

  function commitAction(nextAction) {
    setActions((previous) => [...previous, nextAction])
    setRedoStack([])
    setStatusMessage({
      type: 'actionApplied',
      tool: nextAction.tool,
      effect: nextAction.effect,
      blurStyle: nextAction.blurStyle
    })
  }

  function syncDraftAction(nextDraftAction) {
    draftActionRef.current = nextDraftAction
    setDraftAction(nextDraftAction)
  }

  function handleEffectSelect(nextEffect) {
    setEffect(nextEffect)

    if (nextEffect === 'blur' && !blurSupported) {
      setBlurStyle('solid')
    }
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setIsLoading(true)
    setStatusMessage({ type: 'loadingImage' })

    try {
      const nextAsset = await loadImageAsset(file)
      variantCacheRef.current = new Map()
      setImageAsset(nextAsset)
      setActions([])
      setRedoStack([])
      syncDraftAction(null)
      setHoverPoint(null)
      setStatusMessage({
        type: 'fileLoaded',
        name: nextAsset.name,
        width: nextAsset.width,
        height: nextAsset.height
      })
    } catch (error) {
      setStatusMessage({
        type: error?.message === 'load_image_failed' ? 'loadFailed' : 'loadFailed'
      })
    } finally {
      setIsLoading(false)
      event.target.value = ''
    }
  }

  function handlePointerDown(event) {
    const isMousePointer = event.pointerType === 'mouse'

    if (!imageAsset || !event.isPrimary || (isMousePointer && event.button !== 0)) {
      return
    }

    const point = getCanvasPoint(event)

    if (!point) {
      return
    }

    canvasRef.current?.setPointerCapture(event.pointerId)
    pointerStateRef.current = {
      drawing: true,
      pointerId: event.pointerId
    }

    setHoverPoint(point)

    if (tool === 'brush') {
      syncDraftAction({
        ...buildActionBase(),
        points: [point]
      })
      return
    }

    syncDraftAction({
      ...buildActionBase(),
      origin: point,
      rect: {
        x: point.x,
        y: point.y,
        width: 0,
        height: 0
      }
    })
  }

  function handlePointerMove(event) {
    if (!imageAsset) {
      return
    }

    const point = getCanvasPoint(event)

    if (!point) {
      return
    }

    setHoverPoint(point)

    if (!pointerStateRef.current.drawing) {
      return
    }

    const currentDraft = draftActionRef.current

    if (!currentDraft) {
      return
    }

    if (currentDraft.tool === 'rectangle') {
      syncDraftAction({
        ...currentDraft,
        rect: createNormalizedRect(currentDraft.origin, point)
      })
      return
    }

    syncDraftAction({
      ...currentDraft,
      points: appendInterpolatedPoints(
        currentDraft.points,
        point,
        Math.max(1, currentDraft.brushSize * 0.18)
      )
    })
  }

  function finalizeDraft(point) {
    const currentDraft = draftActionRef.current

    pointerStateRef.current = {
      drawing: false,
      pointerId: null
    }

    if (!currentDraft) {
      syncDraftAction(null)
      return
    }

    let nextDraft = currentDraft

    if (point) {
      if (currentDraft.tool === 'rectangle') {
        nextDraft = {
          ...currentDraft,
          rect: createNormalizedRect(currentDraft.origin, point)
        }
      } else {
        nextDraft = {
          ...currentDraft,
          points: appendInterpolatedPoints(
            currentDraft.points,
            point,
            Math.max(1, currentDraft.brushSize * 0.18)
          )
        }
      }
    }

    if (nextDraft.tool === 'rectangle') {
      const { rect } = nextDraft

      if (rect.width > 0 && rect.height > 0) {
        const { origin, ...committedAction } = nextDraft
        commitAction(committedAction)
      }

      syncDraftAction(null)
      return
    }

    if (nextDraft.points?.length) {
      commitAction(nextDraft)
    }

    syncDraftAction(null)
  }

  function handlePointerUp(event) {
    if (pointerStateRef.current.pointerId !== event.pointerId) {
      return
    }

    const point = getCanvasPoint(event)

    if (canvasRef.current?.hasPointerCapture(event.pointerId)) {
      canvasRef.current.releasePointerCapture(event.pointerId)
    }

    finalizeDraft(point)
  }

  function handlePointerCancel(event) {
    if (pointerStateRef.current.pointerId !== event.pointerId) {
      return
    }

    if (canvasRef.current?.hasPointerCapture(event.pointerId)) {
      canvasRef.current.releasePointerCapture(event.pointerId)
    }

    pointerStateRef.current = {
      drawing: false,
      pointerId: null
    }
    syncDraftAction(null)
    setStatusMessage({ type: 'dragCanceled' })
  }

  function handlePointerLeave() {
    if (!pointerStateRef.current.drawing) {
      setHoverPoint(null)
    }
  }

  function handleUndo() {
    setActions((previous) => {
      if (!previous.length) {
        return previous
      }

      const lastAction = previous[previous.length - 1]
      setRedoStack((redoPrevious) => [lastAction, ...redoPrevious])
      setStatusMessage({ type: 'undo' })
      return previous.slice(0, -1)
    })
  }

  function handleRedo() {
    setRedoStack((previous) => {
      if (!previous.length) {
        return previous
      }

      const [nextAction, ...rest] = previous
      setActions((actionPrevious) => [...actionPrevious, nextAction])
      setStatusMessage({ type: 'redo' })
      return rest
    })
  }

  function handleReset() {
    setActions([])
    setRedoStack([])
    syncDraftAction(null)
    setStatusMessage({ type: 'reset' })
  }

  async function handleDownload() {
    if (!imageAsset) {
      return
    }

    setIsExporting(true)
    setStatusMessage({ type: 'exporting' })

    try {
      const exportCanvas = exportComposite({
        sourceCanvas: imageAsset.sourceCanvas,
        actions,
        variantCache: variantCacheRef.current
      })

      const outputType = SUPPORTED_TYPES.includes(imageAsset.fileType)
        ? imageAsset.fileType
        : 'image/png'

      const blob = await new Promise((resolve) => {
        exportCanvas.toBlob(resolve, outputType, 0.95)
      })

      if (!blob) {
        throw new Error('export_failed')
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const extension = outputType === 'image/jpeg'
        ? 'jpg'
        : outputType === 'image/webp'
          ? 'webp'
          : 'png'

      link.href = url
      link.download = `${imageAsset.name.replace(/\.[^.]+$/, '')}-edited.${extension}`
      link.click()
      URL.revokeObjectURL(url)
      setStatusMessage({
        type: 'downloadReady',
        width: imageAsset.width,
        height: imageAsset.height
      })
    } catch (error) {
      setStatusMessage({
        type: error?.message === 'export_failed' ? 'downloadFailed' : 'downloadFailed'
      })
    } finally {
      setIsExporting(false)
    }
  }

  const hasImage = Boolean(imageAsset)
  const canUndo = actions.length > 0
  const canRedo = redoStack.length > 0
  const selectedTool = toolOptions.find((option) => option.value === tool)
  const selectedBlurStyle = blurStyleOptions.find((option) => option.value === blurStyle)
  const currentEffectLabel = getCurrentEffectLabel()
  const actionsLabel = t('misc.edits', { count: actions.length })
  const effectGuidance = effect === 'pixelate'
    ? t('guidance.effectPixelate')
    : blurStyle === 'smooth'
      ? t('guidance.effectSmooth')
      : t('guidance.effectSolid')
  const statusText = getStatusText(statusMessage)

  return (
    <div className="app-shell">
      <input
        ref={fileInputRef}
        className="hidden-input"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
      />

      <header className="topbar">
        <div className="brand-block">
          <p className="eyebrow">{t('meta.kicker')}</p>
          <h1>{t('meta.title')}</h1>
          <p className="brand-copy">{t('meta.subtitle')}</p>
        </div>

        <div className="file-block">
          <p className="eyebrow">{t('file.label')}</p>
          <strong>{imageAsset ? imageAsset.name : t('file.none')}</strong>
          <p>{imageAsset ? `${imageAsset.width} x ${imageAsset.height}` : t('file.hint')}</p>
        </div>

        <div className="header-utility">
          <div className="utility-row">
            <div className="switch-card">
              <p className="eyebrow">{t('language.label')}</p>
              <div className="toggle-row" role="group" aria-label={t('language.label')}>
                {LANGUAGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={language === option.value ? 'toggle-button active' : 'toggle-button'}
                    onClick={() => setLanguage(option.value)}
                    aria-pressed={language === option.value}
                  >
                    {t(option.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <div className="switch-card">
              <p className="eyebrow">{t('theme.label')}</p>
              <div className="toggle-row" role="group" aria-label={t('theme.label')}>
                {THEME_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={theme === option.value ? 'toggle-button active' : 'toggle-button'}
                    onClick={() => setTheme(option.value)}
                    aria-pressed={theme === option.value}
                  >
                    {t(option.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="action-button primary"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              {isLoading ? t('actions.loading') : t('actions.upload')}
            </button>
            <button
              className="action-button secondary"
              type="button"
              onClick={handleDownload}
              disabled={!hasImage || isExporting}
            >
              {isExporting ? t('actions.exporting') : t('actions.download')}
            </button>
            <button
              className="action-button quiet"
              type="button"
              onClick={handleReset}
              disabled={!hasImage}
            >
              {t('actions.reset')}
            </button>
          </div>
        </div>
      </header>

      <div className="app-body">
        <aside className="control-sidebar">
          <section className="panel-card">
            <div className="panel-heading">
              <div>
                <p className="section-label">{t('panels.tools')}</p>
                <h2>{t('panels.toolsTitle')}</h2>
              </div>
              <span className="meta-chip">{selectedTool?.label}</span>
            </div>

            <div className="button-grid two-up">
              {toolOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={tool === option.value ? 'control-button active' : 'control-button'}
                  onClick={() => setTool(option.value)}
                  disabled={!hasImage}
                  aria-pressed={tool === option.value}
                >
                  <span className="control-title">{option.label}</span>
                  <span className="control-meta">{option.hotkey}</span>
                  <span className="control-copy">{option.summary}</span>
                </button>
              ))}
            </div>

            <div className="history-row">
              <button
                type="button"
                className="action-button secondary history-button"
                onClick={handleUndo}
                disabled={!canUndo}
              >
                {t('actions.undo')}
              </button>
              <button
                type="button"
                className="action-button secondary history-button"
                onClick={handleRedo}
                disabled={!canRedo}
              >
                {t('actions.redo')}
              </button>
            </div>
          </section>

          <section className="panel-card">
            <div className="panel-heading">
              <div>
                <p className="section-label">{t('panels.effect')}</p>
                <h2>{t('panels.effectTitle')}</h2>
              </div>
              <span className="meta-chip">{currentEffectLabel}</span>
            </div>

            <div className="button-grid single-column">
              {effectOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={effect === option.value ? 'control-button active' : 'control-button'}
                  onClick={() => handleEffectSelect(option.value)}
                  disabled={!hasImage}
                  aria-pressed={effect === option.value}
                >
                  <span className="control-title">{option.label}</span>
                  <span className="control-copy">{option.summary}</span>
                  <span className="control-note">{option.caution}</span>
                </button>
              ))}
            </div>

            {effect === 'blur' && (
              <>
                <label className="field-heading">
                  <span>{t('fields.blurStyle')}</span>
                  <span>{selectedBlurStyle?.label}</span>
                </label>
                <div className="segmented-row">
                  {blurStyleOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={blurStyle === option.value ? 'segment-button active' : 'segment-button'}
                      onClick={() => setBlurStyle(option.value)}
                      disabled={!hasImage || (option.value === 'smooth' && !blurSupported)}
                      aria-pressed={blurStyle === option.value}
                      title={!blurSupported && option.value === 'smooth' ? t('guidance.supportBlur') : option.summary}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {!blurSupported && effect === 'blur' && (
              <p className="support-note">{t('guidance.supportBlur')}</p>
            )}

            <p className="panel-note">{effectGuidance}</p>
          </section>

          <section className="panel-card">
            <div className="panel-heading">
              <div>
                <p className="section-label">{t('panels.adjustments')}</p>
                <h2>{t('panels.adjustmentsTitle')}</h2>
              </div>
              <span className="meta-chip">{getCurrentStrengthLabel()}</span>
            </div>

            <label className="field-heading" htmlFor="brush-size">
              <span>{t('fields.brushSize')}</span>
              <span>{brushSize}px</span>
            </label>
            <input
              id="brush-size"
              type="range"
              min="4"
              max="180"
              step="2"
              value={brushSize}
              onChange={(event) => setBrushSize(Number(event.target.value))}
              disabled={!hasImage}
            />

            {effect === 'blur' && blurStyle === 'smooth' && (
              <>
                <label className="field-heading" htmlFor="smooth-strength">
                  <span>{t('fields.blurAmount')}</span>
                  <span>{smoothStrength}px</span>
                </label>
                <input
                  id="smooth-strength"
                  type="range"
                  min="4"
                  max="32"
                  step="2"
                  value={smoothStrength}
                  onChange={(event) => setSmoothStrength(Number(event.target.value))}
                  disabled={!hasImage || !blurSupported}
                />
              </>
            )}

            {effect === 'pixelate' && (
              <>
                <label className="field-heading" htmlFor="pixelate-strength">
                  <span>{t('fields.blockSize')}</span>
                  <span>{pixelateStrength}px</span>
                </label>
                <input
                  id="pixelate-strength"
                  type="range"
                  min="4"
                  max="36"
                  step="2"
                  value={pixelateStrength}
                  onChange={(event) => setPixelateStrength(Number(event.target.value))}
                  disabled={!hasImage}
                />
              </>
            )}

            {effect === 'blur' && blurStyle === 'solid' && (
              <>
                <label className="field-heading" htmlFor="redact-opacity">
                  <span>{t('fields.fillOpacity')}</span>
                  <span>{redactOpacity}%</span>
                </label>
                <input
                  id="redact-opacity"
                  type="range"
                  min="40"
                  max="100"
                  step="5"
                  value={redactOpacity}
                  onChange={(event) => setRedactOpacity(Number(event.target.value))}
                  disabled={!hasImage}
                />

                <label className="field-heading" htmlFor="redact-color">
                  <span>{t('fields.fillColor')}</span>
                  <span>{redactColor.toUpperCase()}</span>
                </label>
                <input
                  id="redact-color"
                  type="color"
                  value={redactColor}
                  onChange={(event) => setRedactColor(event.target.value)}
                  disabled={!hasImage}
                />
              </>
            )}
          </section>

          <section className="panel-card panel-card-muted">
            <div className="panel-heading">
              <div>
                <p className="section-label">{t('panels.guidance')}</p>
                <h2>{t('panels.guidanceTitle')}</h2>
              </div>
              <span className="meta-chip">{actionsLabel}</span>
            </div>

            <ul className="guidance-list">
              <li>{t('guidance.item1')}</li>
              <li>{t('guidance.item2')}</li>
              <li>{t('guidance.item3')}</li>
            </ul>

            <p className="shortcut-strip">{t('misc.shortcut')}</p>
          </section>
        </aside>

        <main className="workspace-column">
          <section className="status-card" role="status" aria-live="polite">
            <div className="status-copy">
              <p className="section-label">{t('panels.status')}</p>
              <strong>{statusText}</strong>
              <p>{t('workspace.statusLine', { tool: selectedTool?.label, effect: currentEffectLabel })}</p>
            </div>

            <div className="status-badges">
              <span className="status-badge">{selectedTool?.label}</span>
              <span className="status-badge">{currentEffectLabel}</span>
              <span className="status-badge">{getCurrentStrengthLabel()}</span>
              <span className="status-badge">{actionsLabel}</span>
            </div>
          </section>

          <section ref={stageRef} className="canvas-card">
            {!hasImage ? (
              <div className="empty-stage">
                <div className="empty-copy">
                  <p className="eyebrow">{t('workspace.emptyKicker')}</p>
                  <h2>{t('workspace.emptyTitle')}</h2>
                  <p>{t('workspace.emptyCopy')}</p>
                </div>

                <div className="empty-actions">
                  <button
                    className="action-button primary"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    {isLoading ? t('actions.loading') : t('actions.choose')}
                  </button>
                  <span className="empty-note">{t('workspace.emptyNote')}</span>
                </div>
              </div>
            ) : (
              <div className="canvas-surface">
                <canvas
                  ref={canvasRef}
                  className="editor-canvas"
                  width={viewSize.width}
                  height={viewSize.height}
                  onContextMenu={(event) => event.preventDefault()}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerCancel}
                  onPointerLeave={handlePointerLeave}
                />
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

export default App
