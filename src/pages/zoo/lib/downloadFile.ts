// 만든 내용을 파일로 내려받게 한다.
// 클릭하자마자 주소를 없애면 일부 브라우저(사파리 등)에서 내려받기가 취소돼서 조금 뒤에 정리한다
export const downloadTextFile = (content: string, fileName: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
