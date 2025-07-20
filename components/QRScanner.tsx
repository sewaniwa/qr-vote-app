'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/library';
import { QRScannerProps } from '@/types/voting';

export default function QRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const codeReader = useRef<BrowserQRCodeReader | null>(null);

  useEffect(() => {
    codeReader.current = new BrowserQRCodeReader();
    
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    if (!codeReader.current || !videoRef.current) return;

    try {
      setIsScanning(true);
      setHasPermission(true);

      const devices = await codeReader.current.listVideoInputDevices();
      if (devices.length === 0) {
        throw new Error('カメラが見つかりません');
      }

      // 背面カメラを優先的に選択
      const selectedDevice = devices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      ) || devices[0];

      await codeReader.current.decodeFromVideoDevice(
        selectedDevice.deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const text = result.getText();
            if (text) {
              onScanSuccess(text);
              stopScanning();
            }
          }
          if (error && error.name !== 'NotFoundException') {
          }
        }
      );
    } catch (_error) {
      setHasPermission(false);
      setIsScanning(false);
      onScanError(_error instanceof Error ? _error.message : 'カメラアクセスに失敗しました');
    }
  };

  const stopScanning = () => {
    if (codeReader.current) {
      codeReader.current.reset();
    }
    setIsScanning(false);
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      startScanning();
    } catch (_error) {
      setHasPermission(false);
      onScanError('カメラへのアクセス許可が必要です');
    }
  };

  if (hasPermission === false) {
    return (
      <div className="qr-scanner-container">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">カメラアクセスが必要です</h3>
          <p className="text-gray-600 mb-4">QRコードをスキャンするためにカメラへのアクセスを許可してください。</p>
          <button
            onClick={requestCameraPermission}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontWeight: 'bold',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'background-color 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1d4ed8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
          >
            カメラを有効にする
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-scanner-container">
      <div className="relative bg-white rounded-lg shadow-md overflow-hidden">
        <div className="text-center p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">QRコードをスキャン</h3>
          <p className="text-gray-600 text-sm">QRコードをカメラに向けてください</p>
        </div>
        
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full h-64 object-cover"
            autoPlay
            playsInline
            muted
          />
          <div className="qr-scanner-overlay" />
        </div>

        <div className="p-4 space-y-3">
          {!isScanning ? (
            <button
              onClick={startScanning}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontWeight: 'bold',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'background-color 0.3s ease',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1d4ed8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
            >
              スキャン開始
            </button>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-gray-600">スキャン中...</span>
              </div>
              <button
                onClick={stopScanning}
                className="mt-3 w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                停止
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}