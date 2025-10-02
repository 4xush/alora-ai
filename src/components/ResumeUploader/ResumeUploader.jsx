import React, { useState, useEffect } from "react";
import { Upload, Button, message, Typography, Tag, Space, Spin } from "antd";
import {
  UploadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  LoadingOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { parsePDF, parseDOCX } from "../../services/resumeService.js";

const ResumeUploader = ({ onParsed, existingResume }) => {
  const [fileList, setFileList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize fileList with existing resume if available
  useEffect(() => {
    if (existingResume?.fileName) {
      setFileList([
        {
          name: existingResume.fileName,
          type: existingResume.fileType,
          uid: "-1",
          status: "done",
        },
      ]);
    }
  }, [existingResume]);

  const handleRemove = () => {
    setFileList([]);
    // Clear the resume data in parent component
    onParsed("", { fileName: "", fileType: "" });
    message.info("Resume removed");
  };

  const beforeUpload = async (file) => {
    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isDocx =
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".docx");

    if (!isPdf && !isDocx) {
      message.error("Invalid file. Please upload a PDF or DOCX.");
      return Upload.LIST_IGNORE;
    }

    try {
      setIsLoading(true);
      message.loading({ content: "Parsing resume...", key: "resumeParsing" });

      let text = "";
      if (isPdf) {
        console.log("Parsing PDF...");
        text = await parsePDF(file);
      } else {
        console.log("Parsing DOCX...");
        text = await parseDOCX(file);
      }

      console.log("Parsed text length:", text.length);

      // Set file list immediately to show the file
      setFileList([file]);

      // Pass the parsed text to parent component
      await onParsed(text, { fileName: file.name, fileType: file.type });

      message.success({
        content: "Resume parsed successfully!",
        key: "resumeParsing",
      });
    } catch (e) {
      console.error("Resume parsing error:", e);
      message.error({
        content: "Failed to parse resume: " + (e.message || "Unknown error"),
        key: "resumeParsing",
      });
    } finally {
      setIsLoading(false);
    }

    return Upload.LIST_IGNORE; // prevent auto upload
  };

  return (
    <div>
      <Typography.Text type="secondary" className="text-sm block mb-3">
        PDF preferred; DOCX supported as fallback
      </Typography.Text>

      {existingResume?.text && existingResume?.fileName ? (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {existingResume.fileName.endsWith(".pdf") ? (
                <FilePdfOutlined className="text-blue-600 text-base" />
              ) : (
                <FileWordOutlined className="text-blue-600 text-base" />
              )}
              <div>
                <Typography.Text className="text-sm font-medium block">
                  {existingResume.fileName}
                </Typography.Text>
                <Typography.Text type="secondary" className="text-xs">
                  {existingResume.text.length} characters extracted
                </Typography.Text>
              </div>
            </div>
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={handleRemove}
              danger
              className="hover:bg-red-50"
            >
              Remove
            </Button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <Spin indicator={<LoadingOutlined className="text-base" spin />} />
          <Typography.Text className="text-sm text-blue-600">
            Parsing resume and extracting information...
          </Typography.Text>
        </div>
      ) : (
        <Upload
          beforeUpload={beforeUpload}
          fileList={[]}
          showUploadList={false}
          disabled={isLoading}
        >
          <Button
            icon={<UploadOutlined />}
            disabled={isLoading}
            size="medium"
            className="w-full"
          >
            {existingResume?.fileName ? "Replace Resume" : "Select Resume"}
          </Button>
        </Upload>
      )}
    </div>
  );
};

export default ResumeUploader;
