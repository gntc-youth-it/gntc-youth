export interface UploadToS3Options {
  onProgress?: (progress: number) => void
}

export function uploadToS3(
  presignedUrl: string,
  blob: Blob,
  contentType: string,
  options?: UploadToS3Options
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && options?.onProgress) {
        options.onProgress(Math.round((event.loaded / event.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`업로드에 실패했습니다. (${xhr.status})`))
      }
    })

    xhr.addEventListener('error', () =>
      reject(new Error('네트워크 오류로 업로드에 실패했습니다.'))
    )

    xhr.addEventListener('abort', () =>
      reject(new Error('업로드가 취소되었습니다.'))
    )

    xhr.open('PUT', presignedUrl)
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.send(blob)
  })
}
