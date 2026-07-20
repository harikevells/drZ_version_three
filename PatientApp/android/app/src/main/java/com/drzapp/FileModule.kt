package com.drzapp

import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import com.facebook.react.bridge.*
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.InputStream
import java.io.OutputStream

class FileModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "FileModule"
    }

    @ReactMethod
    fun saveToDownloads(sourceFilePath: String, fileName: String, promise: Promise) {
        try {
            val cleanPath = sourceFilePath.replace("file://", "")
            val srcFile = File(cleanPath)
            if (!srcFile.exists()) {
                promise.reject("FILE_NOT_FOUND", "Source file does not exist: ${srcFile.absolutePath}")
                return
            }

            val context = reactApplicationContext
            val resolver = context.contentResolver

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                }

                val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
                if (uri == null) {
                    promise.reject("INSERT_FAILED", "Failed to create MediaStore entry in Downloads")
                    return
                }

                resolver.openOutputStream(uri).use { outputStream ->
                    if (outputStream == null) {
                        promise.reject("STREAM_FAILED", "Failed to open output stream for MediaStore Uri")
                        return
                    }
                    FileInputStream(srcFile).use { inputStream ->
                        inputStream.copyTo(outputStream)
                    }
                }
                promise.resolve(uri.toString())
            } else {
                val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                if (!downloadsDir.exists() && !downloadsDir.mkdirs()) {
                    promise.reject("DIR_ERROR", "Failed to create Downloads directory")
                    return
                }
                val destFile = File(downloadsDir, fileName)
                FileInputStream(srcFile).use { inputStream ->
                    FileOutputStream(destFile).use { outputStream ->
                        inputStream.copyTo(outputStream)
                    }
                }
                promise.resolve(destFile.absolutePath)
            }
        } catch (e: Exception) {
            promise.reject("SAVE_FAILED", e.message, e)
        }
    }
}
