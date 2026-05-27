'use client'

import { useEffect } from 'react'

export default function SiteProtection() {
  useEffect(() => {
    // Désactive le clic droit
    const noContext = (e: MouseEvent) => e.preventDefault()

    // Désactive les raccourcis clavier sensibles
    const noShortcuts = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      // Ctrl/Cmd + U (source), S (save), A (tout sélectionner), C (copier), P (print), Shift+I (devtools)
      if ((e.ctrlKey || e.metaKey) && ['u', 's', 'a', 'c', 'p'].includes(k)) {
        e.preventDefault()
        return false
      }
      // F12 (devtools)
      if (k === 'f12') {
        e.preventDefault()
        return false
      }
      // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (devtools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(k)) {
        e.preventDefault()
        return false
      }
    }

    // Désactive la sélection de texte par double-clic/glissement
    const noSelect = (e: Event) => e.preventDefault()

    // Désactive le drag & drop d'images et vidéos
    const noDrag = (e: DragEvent) => e.preventDefault()

    // Désactive Ctrl+C / copie via le presse-papier
    const noCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      e.clipboardData?.clearData()
    }

    document.addEventListener('contextmenu', noContext)
    document.addEventListener('keydown', noShortcuts)
    document.addEventListener('selectstart', noSelect)
    document.addEventListener('dragstart', noDrag)
    document.addEventListener('copy', noCopy)

    return () => {
      document.removeEventListener('contextmenu', noContext)
      document.removeEventListener('keydown', noShortcuts)
      document.removeEventListener('selectstart', noSelect)
      document.removeEventListener('dragstart', noDrag)
      document.removeEventListener('copy', noCopy)
    }
  }, [])

  return null
}
