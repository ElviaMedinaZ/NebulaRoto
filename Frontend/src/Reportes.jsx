import { useState, useEffect } from 'react'
import {
    deleteAnonymousReport,
    downloadAnonymousReportEvidence,
    getAnonymousReports,
    updateAnonymousReportStatus,
} from './anonymousReportsApi.js'

const reportStatuses = ['Recibido', 'En revisión', 'En seguimiento', 'Resuelto']

function Reportes({ onBack }) {
    const [reports, setReports] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [savingReportId, setSavingReportId] = useState('')
    const [deletingReportId, setDeletingReportId] = useState('')
    const [downloadingReportId, setDownloadingReportId] = useState('')
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')

    useEffect(() => {
        let isMounted = true
        getAnonymousReports()
            .then((loadedReports) => {
                if (isMounted) setReports(loadedReports)
            })
            .catch((loadError) => {
                if (isMounted) setError(loadError.message)
            })
            .finally(() => {
                if (isMounted) setIsLoading(false)
            })

        return () => { isMounted = false }
    }, [])

    const handleStatusChange = async (report, status) => {
        setSavingReportId(report._id)
        setError('')
        setNotice('')
        try {
            const updatedReport = await updateAnonymousReportStatus(report._id, status)
            setReports((currentReports) => currentReports.map((item) => (
                item._id === report._id ? updatedReport : item
            )))
            setNotice(`Se actualizó el avance del folio ${report.folio}.`)
        } catch (updateError) {
            setError(updateError.message)
        } finally {
            setSavingReportId('')
        }
    }

    const handleDelete = async (report) => {
        if (!window.confirm(`¿Eliminar el reporte ${report.folio}? Esta acción no se puede deshacer.`)) return

        setDeletingReportId(report._id)
        setError('')
        setNotice('')
        try {
            await deleteAnonymousReport(report._id)
            setReports((currentReports) => currentReports.filter((item) => item._id !== report._id))
            setNotice(`Se eliminó el reporte ${report.folio}.`)
        } catch (deleteError) {
            setError(deleteError.message)
        } finally {
            setDeletingReportId('')
        }
    }

    const handleEvidenceDownload = async (report) => {
        setDownloadingReportId(report._id)
        setError('')
        try {
            const evidence = await downloadAnonymousReportEvidence(report._id)
            const downloadUrl = URL.createObjectURL(evidence)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = report.evidence.fileName
            link.click()
            window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
        } catch (downloadError) {
            setError(downloadError.message)
        } finally {
            setDownloadingReportId('')
        }
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
            {/* Cabecera */}
            <div style={{ 
                background: 'rgba(15, 23, 42, 0.8)', 
                border: '1px solid #334155', 
                borderRadius: '16px', 
                padding: '24px', 
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <span style={{ 
                        fontSize: '11px', 
                        textTransform: 'uppercase', 
                        background: '#3b0764', 
                        color: '#d8b4fe', 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontWeight: 'bold',
                        border: '1px solid #6b21a8'
                    }}>
                        Administración institucional
                    </span>
                    <h2 style={{ color: '#fff', fontSize: '22px', margin: '10px 0 5px 0' }}>Bandeja de Reportes Anónimos</h2>
                    <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Consulta la información compartida y actualiza el avance que la usuaria verá con su folio.</p>
                </div>
                {onBack && (
                    <button 
                        type="button" 
                        onClick={onBack}
                        style={{
                            background: '#1e293b',
                            color: '#cbd5e1',
                            border: '1px solid #475569',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500'
                        }}
                    >
                        ← Volver al panel
                    </button>
                )}
            </div>

            {error && <div style={{ background: '#4c0519', border: '1px solid #be123c', color: '#ffe4e6', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}
            {notice && <div style={{ background: '#064e3b', border: '1px solid #047857', color: '#ecfdf5', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>{notice}</div>}

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', border: '1px solid #334155' }}>
                    Cargando reportes anónimos…
                </div>
            ) : reports.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {reports.map((report) => (
                        <div 
                            key={report._id}
                            style={{ 
                                background: 'rgba(15, 23, 42, 0.9)', 
                                border: '1px solid #334155', 
                                borderRadius: '16px', 
                                padding: '20px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                gap: '20px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                    <span style={{ 
                                        fontFamily: 'monospace', 
                                        background: '#3b0764', 
                                        color: '#e9d5ff', 
                                        padding: '4px 8px', 
                                        borderRadius: '6px', 
                                        fontSize: '12px',
                                        border: '1px solid #6b21a8'
                                    }}>
                                        {report.folio}
                                    </span>
                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                        📅 {new Date(report.createdAt).toLocaleString('es-MX')}
                                    </span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', marginBottom: '12px', color: '#cbd5e1' }}>
                                    <div><strong>Tipo de violencia:</strong> <span style={{ color: '#d8b4fe' }}>{report.type}</span></div>
                                    <div><strong>Lugar:</strong> {report.place}</div>
                                </div>

                                <div style={{ 
                                    background: '#020617', 
                                    border: '1px solid #1e293b', 
                                    padding: '12px', 
                                    borderRadius: '10px', 
                                    fontSize: '13px', 
                                    color: '#cbd5e1',
                                    marginBottom: '16px'
                                }}>
                                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}>Descripción del caso:</div>
                                    {report.description}
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                                    {report.evidence?.fileName && (
                                        <button
                                            type="button"
                                            onClick={() => handleEvidenceDownload(report)}
                                            disabled={downloadingReportId === report._id}
                                            style={{
                                                background: '#172554',
                                                color: '#bfdbfe',
                                                border: '1px solid #1d4ed8',
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                cursor: 'pointer',
                                                fontWeight: '500'
                                            }}
                                        >
                                            📎 {downloadingReportId === report._id ? 'Descargando…' : `Evidencia: ${report.evidence.fileName}`}
                                        </button>
                                    )}

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#020617', padding: '6px 10px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Avance:</span>
                                        <select
                                            value={report.status}
                                            onChange={(event) => handleStatusChange(report, event.target.value)}
                                            disabled={savingReportId === report._id}
                                            style={{
                                                background: '#0f172a',
                                                color: '#fff',
                                                border: '1px solid #475569',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                outline: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {reportStatuses.map((status) => (
                                                <option value={status} key={status}>{status}</option>
                                            ))}
                                        </select>
                                        {savingReportId === report._id && <span style={{ fontSize: '11px', color: '#fbbf24' }}>Guardando…</span>}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleDelete(report)}
                                disabled={deletingReportId === report._id}
                                style={{
                                    background: '#4c0519',
                                    color: '#fecdd3',
                                    border: '1px solid #be123c',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {deletingReportId === report._id ? 'Eliminando…' : '🗑️ Eliminar'}
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', border: '1px solid #334155' }}>
                    📭 No hay reportes anónimos registrados en el sistema.
                </div>
            )}
        </div>
    )
}

export default Reportes