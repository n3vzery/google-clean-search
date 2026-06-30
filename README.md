# Google Clean Search

Search Google privately while staying signed in. No logout required.

[Русская версия](#russian-version)

## Features
* Remove account cookies from search requests
* Spoof NID tracker (rotates every 3 days)
* Optional Firefox User Agent
* Strip `X-Client-Data` header
* SafeSearch bypass (toggle in popup)
* Badge indicator shows protection state (green/red)

## Install

### Chrome / Edge / Brave (Developer Mode)

1. Download the latest `.zip` from [Releases](https://github.com/n3vzery/google-clean-search/releases) and extract it,
   or clone the repo:
   ```
   git clone https://github.com/n3vzery/google-clean-search.git
   ```
2. Open `chrome://extensions/` in your browser.
3. Enable **Developer mode** using the toggle in the top right corner.
4. Click **Load unpacked** and select the `google-clean-search` folder.
5. The extension icon appears in your toolbar. Click it to open the popup and toggle protection on/off per service.

> After updating the source files, go to `chrome://extensions/` and click the refresh icon on the card to reload the extension.

### Ungoogled Chromium (.crx)

1. Download `google-clean-search-v4.1.crx` from [Releases](https://github.com/n3vzery/google-clean-search/releases).
2. Open `chrome://extensions/`.
3. Drag and drop the `.crx` file onto the extensions page.
4. Click **Add extension** when prompted.

> Regular Chrome and Edge will block `.crx` installs from outside the Web Store. Use the **Load unpacked** method above instead.

### Build from source

Requires PowerShell and either `chrome`/`chromium` on PATH for CRX signing.

```powershell
git clone https://github.com/n3vzery/google-clean-search.git
cd google-clean-search
.\build.ps1
```

Output files go into `build/`:
* `google-clean-search-v4.1.zip` for manual load unpacked
* `google-clean-search-v4.1.crx` for ungoogled chromium

The first run generates a `google-clean-search.pem` key used to sign the CRX.
Keep it if you want future updates to share the same extension ID.

## License
GPL v3, see [LICENSE](LICENSE).

---

# Russian Version

Приватный поиск в Google без необходимости выхода из аккаунта.

## Возможности
* Удаление файлов cookie аккаунта из поисковых запросов
* Подмена трекера NID (обновляется каждые 3 дня)
* Выбор Firefox User Agent по желанию
* Удаление заголовка `X Client Data`
* Обход SafeSearch (переключатель в окне расширения)
* Индикатор состояния на иконке (зеленая/красная точка)

## Установка

### Chrome / Edge / Brave (режим разработчика)

1. Скачайте последнюю версию `.zip` из раздела [Releases](https://github.com/n3vzery/google-clean-search/releases) и распакуйте её,
   или клонируйте репозиторий:
   ```
   git clone https://github.com/n3vzery/google-clean-search.git
   ```
2. Откройте страницу `chrome://extensions/` в браузере.
3. Включите **Режим разработчика** в правом верхнем углу.
4. Нажмите **Загрузить распакованное расширение** и выберите папку `google-clean-search`.
5. Иконка расширения появится на панели инструментов. Нажмите на неё для переключения защиты.

> После обновления исходных файлов перейдите на страницу `chrome://extensions/` и нажмите кнопку обновления на карточке расширения, чтобы перезагрузить его.

### Ungoogled Chromium (.crx)

1. Скачайте файл `google-clean-search-v4.1.crx` из раздела [Releases](https://github.com/n3vzery/google-clean-search/releases).
2. Откройте страницу `chrome://extensions/`.
3. Перетащите файл `.crx` на страницу расширений.
4. Подтвердите установку во всплывающем окне.

> Обычные версии Chrome и Edge блокируют установку файлов `.crx` не из Web Store. Вместо этого используйте метод установки распакованного расширения.

### Сборка из исходников

Требуется PowerShell, а также наличие `chrome`/`chromium` в системном пути PATH для подписи CRX.

```powershell
git clone https://github.com/n3vzery/google-clean-search.git
cd google-clean-search
.\build.ps1
```

Файлы сборки сохраняются в папку `build/`:
* `google-clean-search-v4.1.zip` для ручной установки распакованного расширения
* `google-clean-search-v4.1.crx` для ungoogled chromium

При первом запуске создается ключ `google-clean-search.pem` для подписи CRX. Сохраните его, если хотите, чтобы будущие обновления сохраняли тот же ID расширения.

## Лицензия
GPL v3, подробности в файле [LICENSE](LICENSE).
