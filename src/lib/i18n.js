export const DEFAULT_LANGUAGE = 'ko'

export const LANGUAGE_OPTIONS = [
  { value: 'ko', labelKey: 'language.options.ko' },
  { value: 'en', labelKey: 'language.options.en' }
]

const translations = {
  ko: {
    meta: {
      title: '이미지 블러 에디터',
      kicker: '로컬 정적 에디터',
      subtitle: '브라우저 안에서만 동작하는 프라이버시 마스킹 도구입니다. 로그인도 서버 업로드도 없습니다.'
    },
    language: {
      label: '언어',
      options: {
        ko: '한국어',
        en: 'English'
      }
    },
    theme: {
      label: '테마',
      options: {
        light: '라이트',
        dark: '다크'
      }
    },
    file: {
      label: '현재 파일',
      none: '아직 선택된 이미지가 없습니다',
      hint: 'PNG, JPG, WebP를 지원합니다.'
    },
    actions: {
      upload: '이미지 업로드',
      choose: '이미지 선택',
      download: '다운로드',
      reset: '초기화',
      undo: '실행 취소',
      redo: '다시 실행',
      loading: '불러오는 중...',
      exporting: '내보내는 중...'
    },
    panels: {
      tools: '도구',
      toolsTitle: '적용 방식을 선택하세요',
      effect: '효과',
      effectTitle: '출력 스타일을 선택하세요',
      adjustments: '조정',
      adjustmentsTitle: '결과를 미세 조정하세요',
      guidance: '안내',
      guidanceTitle: '흐름을 단순하게 유지하세요',
      status: '상태'
    },
    tool: {
      brush: {
        label: '브러시',
        summary: '얼굴, 배경, 불규칙한 영역을 자유롭게 가릴 때 적합합니다.'
      },
      rectangle: {
        label: '사각형',
        summary: '문서, UI, 텍스트 영역을 빠르게 가릴 때 적합합니다.'
      }
    },
    effect: {
      blur: {
        label: '블러',
        summary: '부드러운 블러와 단색 채움으로 범용적인 마스킹을 제공합니다.',
        caution: '민감정보에는 단색 채움을 권장합니다.'
      },
      pixelate: {
        label: '픽셀화',
        summary: 'UI, 스크린샷, 빠른 시각적 가림에 적합합니다.',
        caution: '픽셀화는 안전한 비식별 처리로 간주하면 안 됩니다.'
      }
    },
    blurStyle: {
      smooth: {
        label: '부드럽게',
        summary: '인물, 배경, 일반 마스킹에 자연스럽게 어울립니다.'
      },
      solid: {
        label: '단색 채움',
        summary: '개인정보를 확실히 가리는 불투명 채움 방식입니다.'
      }
    },
    fields: {
      blurStyle: '블러 방식',
      brushSize: '브러시 크기',
      blurAmount: '블러 강도',
      blockSize: '블록 크기',
      fillOpacity: '채움 불투명도',
      fillColor: '채움 색상'
    },
    guidance: {
      effectPixelate: '픽셀화는 스크린샷, UI 라벨, 빠른 시각적 마스킹에 적합합니다.',
      effectSmooth: '부드러운 블러는 시각적 완화 효과이지 안전한 비식별 처리는 아닙니다.',
      effectSolid: '단색 채움은 개인정보를 가릴 때 가장 안전한 기본값입니다.',
      supportBlur: '부드러운 블러는 브라우저의 캔버스 필터 지원이 필요합니다. 단색 채움은 어디서나 동작합니다.',
      item1: '완전히 숨겨야 하는 개인정보에는 단색 채움을 사용하세요.',
      item2: '클릭, 드래그, 사각형 한 번마다 undo 1단계로 기록됩니다.',
      item3: '다운로드는 항상 원본 해상도로 저장됩니다.'
    },
    workspace: {
      statusLine: ({ tool, effect }) => `현재 도구: ${tool}. 현재 효과: ${effect}.`,
      emptyKicker: '준비됨',
      emptyTitle: '이미지를 올리면 바로 가리기 작업을 시작할 수 있습니다.',
      emptyCopy: '브러시나 사각형을 선택한 뒤, 블러·단색 채움·픽셀화를 한 페이지에서 바로 전환해 보세요.',
      emptyNote: '모든 처리는 브라우저 안에서만 실행됩니다.'
    },
    status: {
      ready: '이미지를 올리면 로컬에서 바로 편집을 시작할 수 있습니다.',
      blurFallback: '이 브라우저에서는 부드러운 블러를 지원하지 않아 단색 채움으로 전환했습니다.',
      dragCanceled: '현재 드래그 작업을 취소했습니다.',
      loadingImage: '이미지를 불러오는 중입니다...',
      fileLoaded: ({ name, width, height }) => `${name} 파일을 ${width} x ${height} 해상도로 불러왔습니다.`,
      loadFailed: '이미지를 불러오지 못했습니다.',
      actionApplied: {
        brush: ({ effect }) => `브러시로 ${effect}를 적용했습니다. 실행 취소할 수 있습니다.`,
        rectangle: ({ effect }) => `사각형으로 ${effect}를 적용했습니다. 실행 취소할 수 있습니다.`
      },
      undo: '방금 편집한 내용을 되돌렸습니다.',
      redo: '되돌린 편집을 다시 적용했습니다.',
      reset: '모든 편집을 초기화했습니다.',
      exporting: '원본 해상도로 내보내는 중입니다...',
      downloadReady: ({ width, height }) => `${width} x ${height} 원본 해상도로 다운로드할 준비가 되었습니다.`,
      downloadFailed: '이미지 다운로드에 실패했습니다.'
    },
    namedEffect: {
      smoothBlur: '부드러운 블러',
      solidFill: '단색 채움',
      pixelate: '픽셀화'
    },
    misc: {
      edits: ({ count }) => `편집 ${count}개`,
      blurStrength: ({ value }) => `${value}px 블러`,
      blockStrength: ({ value }) => `${value}px 블록`,
      fillStrength: ({ value }) => `${value}% 채움`,
      shortcut: 'B / R / 1 / 2 / 3 / Ctrl+Z / Ctrl+Y / [ / ]'
    }
  },
  en: {
    meta: {
      title: 'Image Blur Editor',
      kicker: 'Local Static Editor',
      subtitle: 'A privacy-safe masking tool that runs entirely in the browser. No login and no server upload.'
    },
    language: {
      label: 'Language',
      options: {
        ko: '한국어',
        en: 'English'
      }
    },
    theme: {
      label: 'Theme',
      options: {
        light: 'Light',
        dark: 'Dark'
      }
    },
    file: {
      label: 'Current File',
      none: 'No image selected yet',
      hint: 'PNG, JPG, and WebP are supported.'
    },
    actions: {
      upload: 'Upload Image',
      choose: 'Choose Image',
      download: 'Download',
      reset: 'Reset',
      undo: 'Undo',
      redo: 'Redo',
      loading: 'Loading...',
      exporting: 'Exporting...'
    },
    panels: {
      tools: 'Tools',
      toolsTitle: 'Choose how you apply',
      effect: 'Effect',
      effectTitle: 'Pick the output style',
      adjustments: 'Adjustments',
      adjustmentsTitle: 'Fine tune the result',
      guidance: 'Guidance',
      guidanceTitle: 'Keep the flow simple',
      status: 'Status'
    },
    tool: {
      brush: {
        label: 'Brush',
        summary: 'Freehand coverage for faces, backgrounds, and irregular regions.'
      },
      rectangle: {
        label: 'Rectangle',
        summary: 'Fast box selection for text, UI, and document details.'
      }
    },
    effect: {
      blur: {
        label: 'Blur',
        summary: 'Use a soft blur or a solid fill for flexible masking.',
        caution: 'Use Solid Fill for sensitive information.'
      },
      pixelate: {
        label: 'Pixelate',
        summary: 'Use visible blocks for UI, screenshots, and quick masking.',
        caution: 'Do not treat pixelation as secure redaction.'
      }
    },
    blurStyle: {
      smooth: {
        label: 'Smooth',
        summary: 'Soft visual blur for portraits, backgrounds, and gentle masking.'
      },
      solid: {
        label: 'Solid Fill',
        summary: 'Opaque fill for privacy-safe coverage and clear redaction.'
      }
    },
    fields: {
      blurStyle: 'Blur style',
      brushSize: 'Brush size',
      blurAmount: 'Blur amount',
      blockSize: 'Block size',
      fillOpacity: 'Fill opacity',
      fillColor: 'Fill color'
    },
    guidance: {
      effectPixelate: 'Pixelate is best for screenshots, UI labels, and quick visual masking.',
      effectSmooth: 'Smooth blur is visual softening, not secure redaction.',
      effectSolid: 'Solid Fill is the safest default for hiding private information.',
      supportBlur: 'Smooth blur depends on browser canvas filter support. Solid Fill is available everywhere.',
      item1: 'Use Solid Fill for private data that must be fully hidden.',
      item2: 'Each click, drag, or rectangle is stored as one undo step.',
      item3: 'Downloads always export at the original image resolution.'
    },
    workspace: {
      statusLine: ({ tool, effect }) => `Current tool: ${tool}. Current effect: ${effect}.`,
      emptyKicker: 'Ready',
      emptyTitle: 'Upload an image and start masking right away.',
      emptyCopy: 'Use Brush or Rectangle, then switch between Blur, Solid Fill, and Pixelate without leaving the page.',
      emptyNote: 'Everything runs locally in your browser.'
    },
    status: {
      ready: 'Upload an image to start editing locally.',
      blurFallback: 'Smooth blur is not available in this browser. Solid Fill is active instead.',
      dragCanceled: 'The current drag action was canceled.',
      loadingImage: 'Loading image...',
      fileLoaded: ({ name, width, height }) => `${name} loaded at ${width} x ${height}.`,
      loadFailed: 'The image could not be loaded.',
      actionApplied: {
        brush: ({ effect }) => `Applied ${effect} with the brush. Undo is available.`,
        rectangle: ({ effect }) => `Applied ${effect} with the rectangle. Undo is available.`
      },
      undo: 'The latest edit was undone.',
      redo: 'The last undone edit was restored.',
      reset: 'All edits were cleared.',
      exporting: 'Preparing the original-resolution export...',
      downloadReady: ({ width, height }) => `Download ready at ${width} x ${height}.`,
      downloadFailed: 'The download failed.'
    },
    namedEffect: {
      smoothBlur: 'Smooth Blur',
      solidFill: 'Solid Fill',
      pixelate: 'Pixelate'
    },
    misc: {
      edits: ({ count }) => `${count} edit${count === 1 ? '' : 's'}`,
      blurStrength: ({ value }) => `${value}px blur`,
      blockStrength: ({ value }) => `${value}px blocks`,
      fillStrength: ({ value }) => `${value}% fill`,
      shortcut: 'B / R / 1 / 2 / 3 / Ctrl+Z / Ctrl+Y / [ / ]'
    }
  }
}

function getValue(target, key) {
  return key.split('.').reduce((current, segment) => current?.[segment], target)
}

export function createTranslator(language) {
  const dictionary = translations[language] ?? translations[DEFAULT_LANGUAGE]
  const fallback = translations[DEFAULT_LANGUAGE]

  return function translate(key, params = {}) {
    const value = getValue(dictionary, key) ?? getValue(fallback, key)

    if (typeof value === 'function') {
      return value(params)
    }

    if (typeof value === 'string') {
      return value.replace(/\{(\w+)\}/g, (_, token) => String(params[token] ?? ''))
    }

    return key
  }
}
