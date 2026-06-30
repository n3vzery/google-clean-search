# Google Clean Search

Search Google privately while staying signed in. No logout required.

## Languages
* [English](#google-clean-search)
* [Русский](#russian-version)
* [中文](#chinese-version)
* [हिन्दी](#hindi-version)

## Features
* Remove account cookies from search requests
* Spoof NID tracker (rotates every 3 days)
* Optional Firefox User Agent
* Strip `X Client Data` header
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

---

# Chinese Version

在保持登录状态的同时私密搜索 Google。无需退出登录。

## 功能特点
* 从搜索请求中移除账号 Cookie 缓存
* 伪造 NID 追踪器（每 3 天自动更换一次）
* 支持自定义 Firefox 用户代理 (User Agent)
* 移除 `X Client Data` 请求头
* 绕过安全搜索限制（可在弹窗中切换开关）
* 图标自带状态指示灯（绿色开启/红色关闭）

## 安装方法

### Chrome / Edge / Brave (开发者模式)

1. 从 [Releases](https://github.com/n3vzery/google-clean-search/releases) 下载最新的 `.zip` 压缩包并解压，或者克隆此仓库：
   ```
   git clone https://github.com/n3vzery/google-clean-search.git
   ```
2. 在浏览器中打开 `chrome://extensions/`。
3. 开启右上角的 **开发者模式** 开关。
4. 点击 **加载已解压的扩展程序** 并选择 `google-clean-search` 文件夹。
5. 扩展图标将出现在工具栏中。点击即可打开弹窗并针对各服务单独开启或关闭保护。

> 更新本地代码文件后，请前往 `chrome://extensions/` 点击该卡片上的刷新图标以重新加载扩展。

### Ungoogled Chromium (.crx)

1. 从 [Releases](https://github.com/n3vzery/google-clean-search/releases) 下载 `google-clean-search-v4.1.crx`。
2. 打开 `chrome://extensions/`。
3. 将 `.crx` 文件拖放到该扩展管理页面中。
4. 在提示时点击 **添加扩展程序**。

> 原生 Chrome 和 Edge 浏览器会阻止安装非 Web Store 渠道的 `.crx` 扩展。请使用上述的“加载已解压扩展程序”方法安装。

### 源码打包编译

需要安装 PowerShell，并且需要在系统 PATH 环境变量中配置 `chrome`/`chromium` 路径以用于签署 CRX 扩展包。

```powershell
git clone https://github.com/n3vzery/google-clean-search.git
cd google-clean-search
.\build.ps1
```

编译输出的文件位于 `build/` 目录下：
* `google-clean-search-v4.1.zip` 适用于手动加载的解压包
* `google-clean-search-v4.1.crx` 适用于 ungoogled chromium 浏览器

首次运行打包脚本会生成一个 `google-clean-search.pem` 签名密钥文件。请妥善保存，以便后续更新版本时能维持相同的扩展 ID。

## 开源协议
GPL v3 协议授权，详见 [LICENSE](LICENSE) 文件。

---

# Hindi Version

अपने Google खाते में लॉग इन रहते हुए भी निजी तौर पर सर्च करें। साइन आउट करने की कोई आवश्यकता नहीं है।

## मुख्य विशेषताएं
* सर्च रिक्वेस्ट से अकाउंट कुकीज़ को हटाता है
* NID ट्रैकर को बदलता है (हर 3 दिन में नया बनता है)
* विकल्प के रूप में Firefox User Agent चुनने की सुविधा
* `X Client Data` हेडर को हटाता है
* सेफ़ सर्च नियंत्रण को बायपास करने का विकल्प (पॉपअप से चालू/बंद करें)
* आइकन पर सुरक्षा स्थिति बताने वाला लाइट इंडिकेटर (हरा चालू/लाल बंद)

## कैसे इंस्टॉल करें

### Chrome / Edge / Brave (डेवलपर मोड)

1. [Releases](https://github.com/n3vzery/google-clean-search/releases) सेक्शन से नवीनतम `.zip` फ़ाइल डाउनलोड करके अनज़िप करें, या इस रिपॉजिटरी को क्लोन करें:
   ```
   git clone https://github.com/n3vzery/google-clean-search.git
   ```
2. अपने ब्राउज़र में `chrome://extensions/` खोलें।
3. ऊपर दाईं ओर स्थित **Developer mode** को ऑन करें।
4. **Load unpacked** पर क्लिक करें और `google-clean-search` फ़ोल्डर को चुनें।
5. एक्सटेंशन का आइकन आपके टूलबार में दिखाई देने लगेगा। इस पर क्लिक करके आप सुरक्षा सेटिंग्स को बदल सकते हैं।

> सोर्स फ़ाइलों में बदलाव करने के बाद, `chrome://extensions/` पर जाएं और बदलावों को लागू करने के लिए कार्ड पर बने रीफ़्रेश बटन पर क्लिक करें।

### Ungoogled Chromium (.crx)

1. [Releases](https://github.com/n3vzery/google-clean-search/releases) से `google-clean-search-v4.1.crx` फ़ाइल डाउनलोड करें।
2. `chrome://extensions/` पेज खोलें।
3. डाउनलोड की गई `.crx` फ़ाइल को ड्रैग करके इस पेज पर छोड़ें।
4. पूछे जाने पर **Add extension** पर क्लिक करें।

> आम Chrome और Edge ब्राउज़र वेब स्टोर के बाहर की `.crx` फ़ाइलों को ब्लॉक करते हैं। इसके लिए ऊपर दिए गए डेवलपर मोड वाले तरीक़े का उपयोग करें।

### सोर्स कोड से बिल्ड करें

इसके लिए PowerShell होना चाहिए और CRX साइनिंग के लिए PATH में `chrome`/`chromium` जोड़ा होना चाहिए।

```powershell
git clone https://github.com/n3vzery/google-clean-search.git
cd google-clean-search
.\build.ps1
```

तैयार फ़ाइलें `build/` फ़ोल्डर में मिलेंगी:
* `google-clean-search-v4.1.zip` डेवलपर मोड में इस्तेमाल करने के लिए
* `google-clean-search-v4.1.crx` ungoogled chromium ब्राउज़र के लिए

पहली बार बिल्ड चलाने पर CRX साइन करने के लिए `google-clean-search.pem` फ़ाइल बनेगी। इसे संभाल कर रखें ताकि भविष्य के अपडेट में एक्सटेंशन ID न बदले।

## लाइसेंस
GPL v3, जानकारी के लिए [LICENSE](LICENSE) फ़ाइल देखें।
