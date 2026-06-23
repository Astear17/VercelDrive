import { useRouter } from 'next/router'
import { getStoredToken } from '../../utils/protectedRouteHandler'
import DownloadButtonGroup from '../DownloadBtnGtoup'
import { DownloadBtnContainer } from './Containers'

const PDFEmbedPreview: React.FC<{ file: any }> = ({ file }) => {
  const { asPath } = useRouter()
  const hashedToken = getStoredToken(asPath)

  const pdfUrl = `/api/raw/?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`

  return (
    <div>
      <div className="w-full overflow-hidden rounded" style={{ height: '90vh' }}>
        <object data={pdfUrl} type="application/pdf" width="100%" height="100%">
          <iframe src={pdfUrl} frameBorder="0" width="100%" height="100%"></iframe>
        </object>
      </div>
      <DownloadBtnContainer>
        <DownloadButtonGroup />
      </DownloadBtnContainer>
    </div>
  )
}

export default PDFEmbedPreview
