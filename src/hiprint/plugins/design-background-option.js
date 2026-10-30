import $ from 'jquery'

function normalizeBackground(value) {
  if (!value || typeof value.src !== 'string') return {}
  const src = value.src.trim()
  const validSource = /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(src)
    || /^https?:\/\/[^\s"'\\]+$/i.test(src)
    || /^\/(?!\/)[^\s"'\\]*$/.test(src)
  if (!validSource) return {}
  const opacity = value.opacity == null ? 1 : Number(value.opacity)
  return { src, opacity: Number.isFinite(opacity) ? Math.min(1, Math.max(0, opacity)) : 1 }
}

export default class DesignBackgroundOption {
  constructor() {
    this.name = 'designBackground'
    this.value = {}
  }

  createTarget() {
    this.target = $(`
      <div class="hiprint-option-item hiprint-option-item-row hiprint-design-background-option">
        <div class="hiprint-option-item-label">设计底图（不参与打印）</div>
        <div class="hiprint-design-background-source" style="display:flex;align-items:center;gap:4px;width:100%">
          <input type="text" placeholder="请输入图片地址" style="flex:1;min-width:0;width:auto;height:26px;box-sizing:border-box;padding:3px;border:1px solid #a9a9a9;font-size:12px">
          <input type="file" accept="image/png,image/jpeg,image/webp" style="display:none">
          <button type="button" class="hiprint-option-item-settingBtn" style="height:26px;line-height:24px;margin:0;padding:0 5px">选择</button>
          <button type="button" class="hiprint-option-item-settingBtn" style="height:26px;line-height:24px;margin:0;padding:0 5px">应用</button>
        </div>
        <div class="hiprint-design-background-opacity" style="display:flex;align-items:center;gap:4px;margin:8px 0;font-size:12px;white-space:nowrap">
          <span>透明度</span>
          <input type="range" min="0" max="100" value="100" style="flex:1;min-width:0;accent-color:#409eff">
          <span class="hiprint-design-background-percent" style="width:28px;text-align:right">100%</span>
          <button type="button" class="hiprint-option-item-settingBtn hiprint-design-background-remove" style="height:26px;line-height:24px;margin:0;padding:0 5px">移除底图</button>
        </div>
      </div>
    `)
    const address = this.target.find('input[type="text"]')
    const fileInput = this.target.find('input[type="file"]')
    this.target.find('button').eq(0).on('click', () => fileInput.trigger('click'))
    this.target.find('button').eq(1).on('click', () => this.applyAddress())
    address.on('keydown', (event) => {
      if (event.key === 'Enter') this.applyAddress()
    })
    fileInput.on('change', (event) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
        window.alert('请选择不超过 2MB 的 PNG、JPG 或 WebP 图片')
        return
      }
      const reader = new FileReader()
      reader.onload = () => address.val(String(reader.result))
      reader.onerror = () => window.alert('读取底图失败')
      reader.readAsDataURL(file)
    })
    this.target.find('input[type="range"]').on('input', (event) => {
      const opacity = Number(event.target.value) / 100
      this.target.find('.hiprint-design-background-percent').text(`${event.target.value}%`)
      if (!this.value.src) return
      this.value = { ...this.value, opacity }
      this.submit?.()
    })
    this.target.find('.hiprint-design-background-remove').on('click', () => {
      this.value = {}
      this.setValue(this.value)
      this.submit?.()
    })
    return this.target
  }

  applyAddress() {
    const src = this.target.find('input[type="text"]').val().trim()
    const value = normalizeBackground({ src, opacity: this.value.opacity ?? 1 })
    if (!value.src) {
      window.alert('请输入有效的图片 URL 或选择图片')
      return
    }
    this.value = value
    this.setValue(value)
    this.submit?.()
  }

  getValue() {
    return { ...this.value }
  }

  setValue(value) {
    this.value = normalizeBackground(value)
    this.target.find('input[type="text"]').val(this.value.src || '')
    const percent = Math.round((this.value.opacity ?? 1) * 100)
    this.target.find('input[type="range"]').val(percent).prop('disabled', !this.value.src)
    this.target.find('.hiprint-design-background-percent').text(`${percent}%`)
    this.target.find('.hiprint-design-background-remove').toggle(!!this.value.src)
  }

  destroy() {
    this.target.remove()
  }
}
