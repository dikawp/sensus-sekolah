'use client';

import { IncomeTransaction, Student } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { X, Download, Printer } from 'lucide-react';
import { getStudentById } from '@/lib/storage';
import { formatCurrency, formatDate } from '@/lib/dashboardUtils';
import { useAuth } from '@/lib/authContext';
import jsPDF from 'jspdf';
import { useState, useEffect } from 'react';

interface ReceiptModalProps {
  transaction: IncomeTransaction;
  onClose: () => void;
}

export default function ReceiptModal({
  transaction,
  onClose,
}: ReceiptModalProps) {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (transaction.studentId) {
      getStudentById(transaction.studentId).then(setStudent);
    }
  }, [transaction.studentId]);

  const generatePDF = async () => {
    setIsPrinting(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Header
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('KUITANSI PEMBAYARAN', pageWidth / 2, yPosition, {
        align: 'center',
      });

      yPosition += 8;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(user?.schoolName || 'Sekolah PAUD/TK', pageWidth / 2, yPosition, {
        align: 'center',
      });

      yPosition += 12;
      pdf.setDrawColor(0);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);

      yPosition += 8;

      // Receipt Details
      const details = [
        ['Nomor Kuitansi:', transaction.receiptNumber || '-'],
        ['Tanggal:', formatDate(transaction.date)],
        ['Bulan Pembayaran:', transaction.month],
      ];

      pdf.setFontSize(9);
      details.forEach(([label, value]) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, margin + 40, yPosition);
        yPosition += 6;
      });

      yPosition += 4;

      // Student Details (if exists)
      if (student) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('IDENTITAS SISWA', margin, yPosition);
        yPosition += 6;

        const studentDetails = [
          ['Nama Siswa:', student.name],
          ['No. Induk:', student.studentId],
          ['Kelas:', student.class],
          ['Nama Orang Tua:', student.parentName],
          ['No. Telepon:', student.parentPhone],
        ];

        pdf.setFontSize(8);
        studentDetails.forEach(([label, value]) => {
          pdf.setFont('helvetica', 'bold');
          pdf.text(label, margin, yPosition);
          pdf.setFont('helvetica', 'normal');
          pdf.text(value, margin + 35, yPosition);
          yPosition += 5;
        });

        yPosition += 4;
      }

      // Payment Details
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DETAIL PEMBAYARAN', margin, yPosition);
      yPosition += 6;

      const paymentDetails = [
        ['Kategori Pembayaran:', transaction.category],
        ['Jumlah:', formatCurrency(transaction.amount)],
        ['Status:', transaction.status === 'completed' ? 'Lunas' : 'Pending'],
      ];

      pdf.setFontSize(8);
      paymentDetails.forEach(([label, value]) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, margin + 35, yPosition);
        yPosition += 5;
      });

      yPosition += 10;
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);

      yPosition += 15;

      // Signature Area
      pdf.setFontSize(8);
      pdf.text('Penerima', margin, yPosition);
      pdf.text('Bendahara Sekolah', pageWidth / 2, yPosition);

      yPosition += 20;
      pdf.text(user?.name || '_______', margin, yPosition);
      pdf.text('_______', pageWidth / 2, yPosition);

      yPosition += 8;
      pdf.setFontSize(7);
      pdf.text(new Date().toLocaleDateString('id-ID'), margin, yPosition);

      // Download
      const filename = `Kuitansi-${student?.name || 'Bulk'}-${transaction.month}.pdf`;
      pdf.save(filename);
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-96 overflow-y-auto">
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Kuitansi Pembayaran</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Receipt Preview */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 space-y-3 text-sm">
            {/* Header */}
            <div className="text-center border-b pb-3">
              <p className="font-bold text-base">KUITANSI PEMBAYARAN</p>
              <p className="text-xs text-gray-600">{user?.schoolName}</p>
            </div>

            {/* Details */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Nomor:</span>
                <span className="font-medium">{transaction.receiptNumber || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tanggal:</span>
                <span className="font-medium">{formatDate(transaction.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bulan:</span>
                <span className="font-medium">{transaction.month}</span>
              </div>
            </div>

            {/* Student Info */}
            {student && (
              <>
                <div className="border-t pt-2">
                  <p className="font-bold text-xs mb-2">IDENTITAS SISWA</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Nama:</span>
                      <span>{student.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>No. Induk:</span>
                      <span>{student.studentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kelas:</span>
                      <span>{student.class}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Payment Info */}
            <div className="border-t pt-2">
              <p className="font-bold text-xs mb-2">DETAIL PEMBAYARAN</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Kategori:</span>
                  <span>{transaction.category}</span>
                </div>
                <div className="flex justify-between font-bold text-base mt-2">
                  <span>Jumlah:</span>
                  <span className="text-green-600">
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="border-t pt-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Status:</span>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${
                    transaction.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {transaction.status === 'completed' ? 'Lunas' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Tutup
            </button>
            <button
              onClick={generatePDF}
              disabled={isPrinting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
