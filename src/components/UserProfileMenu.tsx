'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'

type Props = {
  userId?: string
  userName?: string
  userEmail?: string
  onLogout: () => void
}

const PRESET_AVATARS = ['👨', '👩', '🧔', '👱‍♂️', '👱‍♀️', '👨‍🦱', '👩‍🦰', '👨‍🦳', '👩‍🦳', '🧑']

function getStorageKey(userId?: string) {
  return `finfamilia_avatar_${userId || 'guest'}`
}

export default function UserProfileMenu({ userId, userName, userEmail, onLogout }: Props) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [tab, setTab] = useState<'avatar' | 'foto'>('avatar')
  const [avatar, setAvatar] = useState<string>('👤')
  const rootRef = useRef<HTMLDivElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const storageKey = useMemo(() => getStorageKey(userId), [userId])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      setAvatar(saved || '👤')
    } catch {
      setAvatar('👤')
    }
  }, [storageKey])

  useEffect(() => {
    const onOutside = (event: MouseEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false)
        setEditing(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const saveAvatar = (value: string) => {
    setAvatar(value)
    try {
      localStorage.setItem(storageKey, value)
    } catch {}
  }

  const resizeToAvatar = (dataUrl: string, size = 512): Promise<string> =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => {
        const minSide = Math.min(image.width, image.height)
        const sx = (image.width - minSide) / 2
        const sy = (image.height - minSide) / 2

        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Nao foi possivel processar imagem'))
          return
        }

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(image, sx, sy, minSide, minSide, 0, 0, size, size)

        resolve(canvas.toDataURL('image/jpeg', 0.92))
      }
      image.onerror = () => reject(new Error('Arquivo de imagem invalido'))
      image.src = dataUrl
    })

  const onFile = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = async () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      if (!result) return

      try {
        const optimized = await resizeToAvatar(result, 512)
        saveAvatar(optimized)
      } catch {
        saveAvatar(result)
      }
    }
    reader.readAsDataURL(file)
  }

  const avatarNode = avatar.startsWith('data:image/') ? (
    <img src={avatar} alt="Avatar" className="profile-avatar-image" />
  ) : (
    <span className="profile-avatar-emoji">{avatar}</span>
  )

  return (
    <div ref={rootRef} className="profile-menu-root">
      <button type="button" className="profile-trigger" onClick={() => setOpen((v) => !v)} aria-label="Abrir perfil">
        <span className="profile-trigger-avatar">{avatarNode}</span>
        <span className="profile-trigger-name">{userName || 'Usuário'}</span>
        <span className="profile-trigger-chevron">▾</span>
      </button>

      {open && !editing && (
        <div className="profile-dropdown glass-card">
          <div className="profile-header profile-header-block">
            <div className="profile-id-row">
              <span className="profile-id-avatar">{avatarNode}</span>
              <div className="profile-id-text">
                <p className="profile-name">{userName || 'Usuário'}</p>
                <p className="profile-email">{userEmail || 'sem e-mail'}</p>
              </div>
            </div>
          </div>

          <button type="button" className="profile-action-btn" onClick={() => setEditing(true)}>
            Alterar foto ou avatar
          </button>
          <button type="button" className="profile-action-btn danger" onClick={onLogout}>
            Sair
          </button>
        </div>
      )}

      {open && editing && (
        <div className="profile-dropdown glass-card profile-editor">
          <div className="profile-editor-top">
            <button type="button" className="profile-back-btn" onClick={() => setEditing(false)}>
              ←
            </button>
            <p>Alterar foto ou avatar</p>
          </div>

          <div className="profile-tabs">
            <button type="button" className={tab === 'avatar' ? 'active' : ''} onClick={() => setTab('avatar')}>
              Avatar
            </button>
            <button type="button" className={tab === 'foto' ? 'active' : ''} onClick={() => setTab('foto')}>
              Foto
            </button>
          </div>

          {tab === 'avatar' ? (
            <div className="profile-avatar-grid">
              {PRESET_AVATARS.map((item) => (
                <button key={item} type="button" className="profile-avatar-option" onClick={() => saveAvatar(item)}>
                  {item}
                </button>
              ))}
            </div>
          ) : (
            <div className="profile-upload-box">
              <div className="profile-upload-preview">{avatarNode}</div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
              <button type="button" className="btn btn-ghost profile-mini-btn" onClick={() => fileRef.current?.click()}>
                Escolher Foto
              </button>
              <button type="button" className="btn btn-ghost profile-mini-btn" onClick={() => saveAvatar('👤')}>
                Avatar Padrão
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
