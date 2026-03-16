const TAU = Math.PI * 2

function createCanvas(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  return canvas
}

function getActionScale(scaleX, scaleY) {
  return Math.min(scaleX, scaleY)
}

function hexToRgba(hex, opacityPercent) {
  const normalized = hex.replace('#', '')
  const full = normalized.length === 3
    ? normalized
        .split('')
        .map((char) => `${char}${char}`)
        .join('')
    : normalized

  const r = Number.parseInt(full.slice(0, 2), 16)
  const g = Number.parseInt(full.slice(2, 4), 16)
  const b = Number.parseInt(full.slice(4, 6), 16)
  const alpha = Math.max(0, Math.min(1, opacityPercent / 100))

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getVariantKey(effect, strength) {
  return `${effect}:${strength}`
}

function drawBrushStroke(context, points, brushSize, scaleX, scaleY, mode) {
  if (!points?.length) {
    return
  }

  const radius = Math.max(1, brushSize * getActionScale(scaleX, scaleY))

  context.save()
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.lineWidth = radius * 2

  if (mode === 'mask') {
    context.strokeStyle = '#000'
    context.fillStyle = '#000'
  }

  if (points.length === 1) {
    const point = points[0]
    context.beginPath()
    context.arc(point.x * scaleX, point.y * scaleY, radius, 0, TAU)
    context.fill()
    context.restore()
    return
  }

  context.beginPath()
  context.moveTo(points[0].x * scaleX, points[0].y * scaleY)

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index]
    context.lineTo(point.x * scaleX, point.y * scaleY)
  }

  context.stroke()

  context.beginPath()

  for (const point of points) {
    context.moveTo(point.x * scaleX + radius, point.y * scaleY)
    context.arc(point.x * scaleX, point.y * scaleY, radius, 0, TAU)
  }

  context.fill()
  context.restore()
}

function drawRectangle(context, rect, scaleX, scaleY, mode) {
  if (!rect || rect.width <= 0 || rect.height <= 0) {
    return
  }

  const x = rect.x * scaleX
  const y = rect.y * scaleY
  const width = rect.width * scaleX
  const height = rect.height * scaleY

  if (mode === 'mask') {
    context.fillStyle = '#000'
  }

  context.fillRect(x, y, width, height)
}

function drawActionMask(context, action, scaleX, scaleY) {
  context.save()
  context.fillStyle = '#000'
  context.strokeStyle = '#000'

  if (action.tool === 'rectangle') {
    drawRectangle(context, action.rect, scaleX, scaleY, 'mask')
  } else {
    drawBrushStroke(context, action.points, action.brushSize, scaleX, scaleY, 'mask')
  }

  context.restore()
}

function drawRedaction(context, action, scaleX, scaleY) {
  context.save()
  const color = hexToRgba(action.color || '#111111', action.opacity || 100)
  context.fillStyle = color
  context.strokeStyle = color

  if (action.tool === 'rectangle') {
    drawRectangle(context, action.rect, scaleX, scaleY, 'fill')
  } else {
    drawBrushStroke(context, action.points, action.brushSize, scaleX, scaleY, 'fill')
  }

  context.restore()
}

function drawEffectAction(context, effectCanvas, action, sourceWidth, sourceHeight, targetWidth, targetHeight, scaleX, scaleY, tempCanvas, tempContext) {
  tempContext.clearRect(0, 0, targetWidth, targetHeight)
  tempContext.globalCompositeOperation = 'source-over'
  tempContext.drawImage(effectCanvas, 0, 0, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight)
  tempContext.globalCompositeOperation = 'destination-in'
  drawActionMask(tempContext, action, scaleX, scaleY)
  tempContext.globalCompositeOperation = 'source-over'
  context.drawImage(tempCanvas, 0, 0)
}

function drawBrushGuide(context, point, brushSize, scaleX, scaleY) {
  if (!point) {
    return
  }

  const radius = Math.max(1, brushSize * getActionScale(scaleX, scaleY))
  context.save()
  context.beginPath()
  context.arc(point.x * scaleX, point.y * scaleY, radius, 0, TAU)
  context.strokeStyle = 'rgba(255, 255, 255, 0.92)'
  context.lineWidth = 1
  context.setLineDash([6, 4])
  context.stroke()
  context.restore()
}

function drawRectangleGuide(context, rect, scaleX, scaleY) {
  if (!rect || rect.width <= 0 || rect.height <= 0) {
    return
  }

  context.save()
  context.setLineDash([8, 5])
  context.strokeStyle = 'rgba(255, 255, 255, 0.92)'
  context.lineWidth = 1
  context.strokeRect(
    rect.x * scaleX,
    rect.y * scaleY,
    rect.width * scaleX,
    rect.height * scaleY
  )
  context.restore()
}

function ensureVariantCanvas(sourceCanvas, effect, strength, variantCache) {
  const key = getVariantKey(effect, strength)

  if (variantCache.has(key)) {
    return variantCache.get(key)
  }

  const variantCanvas = createCanvas(sourceCanvas.width, sourceCanvas.height)
  const context = variantCanvas.getContext('2d')

  if (effect === 'smooth') {
    context.filter = `blur(${strength}px)`
    context.drawImage(sourceCanvas, 0, 0)
    context.filter = 'none'
  } else if (effect === 'pixelate') {
    const blockSize = Math.max(2, strength)
    const scaledWidth = Math.max(1, Math.round(sourceCanvas.width / blockSize))
    const scaledHeight = Math.max(1, Math.round(sourceCanvas.height / blockSize))
    const pixelCanvas = createCanvas(scaledWidth, scaledHeight)
    const pixelContext = pixelCanvas.getContext('2d')

    pixelContext.imageSmoothingEnabled = true
    pixelContext.drawImage(sourceCanvas, 0, 0, scaledWidth, scaledHeight)

    context.imageSmoothingEnabled = false
    context.drawImage(pixelCanvas, 0, 0, scaledWidth, scaledHeight, 0, 0, sourceCanvas.width, sourceCanvas.height)
    context.imageSmoothingEnabled = true
  }

  variantCache.set(key, variantCanvas)
  return variantCanvas
}

export function supportsCanvasBlur() {
  const context = document.createElement('canvas').getContext('2d')
  return Boolean(context && 'filter' in context)
}

export async function loadImageAsset(file) {
  const objectUrl = URL.createObjectURL(file)

  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('load_image_failed'))
      element.src = objectUrl
    })

    const sourceCanvas = createCanvas(image.naturalWidth, image.naturalHeight)
    const context = sourceCanvas.getContext('2d')
    context.drawImage(image, 0, 0)

    return {
      name: file.name,
      width: image.naturalWidth,
      height: image.naturalHeight,
      fileType: file.type,
      sourceCanvas
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export function fitWithinBox(width, height, maxWidth, maxHeight) {
  if (!width || !height || !maxWidth || !maxHeight) {
    return { width: 0, height: 0 }
  }

  const scale = Math.min(maxWidth / width, maxHeight / height, 1)

  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale))
  }
}

export function createNormalizedRect(startPoint, endPoint) {
  return {
    x: Math.min(startPoint.x, endPoint.x),
    y: Math.min(startPoint.y, endPoint.y),
    width: Math.abs(endPoint.x - startPoint.x),
    height: Math.abs(endPoint.y - startPoint.y)
  }
}

export function appendInterpolatedPoints(existingPoints, nextPoint, spacing) {
  if (!existingPoints.length) {
    return [nextPoint]
  }

  const points = [...existingPoints]
  const previous = existingPoints[existingPoints.length - 1]
  const distanceX = nextPoint.x - previous.x
  const distanceY = nextPoint.y - previous.y
  const distance = Math.hypot(distanceX, distanceY)

  if (!distance) {
    return points
  }

  const steps = Math.max(1, Math.ceil(distance / Math.max(1, spacing)))

  for (let step = 1; step <= steps; step += 1) {
    const ratio = step / steps
    points.push({
      x: previous.x + distanceX * ratio,
      y: previous.y + distanceY * ratio
    })
  }

  return points
}

export function renderComposite({
  targetCanvas,
  sourceCanvas,
  actions,
  draftAction,
  width,
  height,
  variantCache,
  hoverPoint,
  hoverBrushSize,
  hoverTool
}) {
  if (!targetCanvas || !sourceCanvas || !width || !height) {
    return
  }

  if (targetCanvas.width !== width) {
    targetCanvas.width = width
  }

  if (targetCanvas.height !== height) {
    targetCanvas.height = height
  }

  const context = targetCanvas.getContext('2d')
  const tempCanvas = createCanvas(width, height)
  const tempContext = tempCanvas.getContext('2d')
  const scaleX = width / sourceCanvas.width
  const scaleY = height / sourceCanvas.height
  const renderActions = draftAction ? [...actions, draftAction] : actions

  context.clearRect(0, 0, width, height)
  context.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, 0, 0, width, height)

  for (const action of renderActions) {
    const isSolidFill =
      action.effect === 'redact' ||
      (action.effect === 'blur' && action.blurStyle === 'solid')

    if (isSolidFill) {
      drawRedaction(context, action, scaleX, scaleY)
      continue
    }

    const variantEffect = action.effect === 'pixelate' ? 'pixelate' : 'smooth'
    const variantCanvas = ensureVariantCanvas(sourceCanvas, variantEffect, action.strength, variantCache)
    drawEffectAction(
      context,
      variantCanvas,
      action,
      sourceCanvas.width,
      sourceCanvas.height,
      width,
      height,
      scaleX,
      scaleY,
      tempCanvas,
      tempContext
    )
  }

  if (draftAction?.tool === 'rectangle') {
    drawRectangleGuide(context, draftAction.rect, scaleX, scaleY)
  }

  if (!draftAction && hoverTool === 'brush' && hoverPoint) {
    drawBrushGuide(context, hoverPoint, hoverBrushSize, scaleX, scaleY)
  }
}

export function exportComposite({ sourceCanvas, actions, variantCache }) {
  const exportCanvas = createCanvas(sourceCanvas.width, sourceCanvas.height)
  renderComposite({
    targetCanvas: exportCanvas,
    sourceCanvas,
    actions,
    draftAction: null,
    width: sourceCanvas.width,
    height: sourceCanvas.height,
    variantCache,
    hoverPoint: null,
    hoverBrushSize: 0,
    hoverTool: null
  })
  return exportCanvas
}

export function clampPoint(point, width, height) {
  return {
    x: Math.max(0, Math.min(width, point.x)),
    y: Math.max(0, Math.min(height, point.y))
  }
}

