import React, { useState, useEffect } from "react";
import { Upload, Button, message, Typography, Tag, Space, Spin } from "antd";
import {
  UploadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  LoadingOutlined,
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
      <Typography.Paragraph type="secondary">
        PDF preferred; DOCX supported as fallback.
      </Typography.Paragraph>

      {existingResume?.text && existingResume?.fileName ? (
        <div className="mb-4">
          <Space direction="vertical" size="small">
            <div className="flex items-center">
              <span className="mr-2">Current Resume:</span>
              <Tag
                color="blue"
                icon={
                  existingResume.fileName.endsWith(".pdf") ? (
                    <FilePdfOutlined />
                  ) : (
                    <FileWordOutlined />
                  )
                }
              >
                {existingResume.fileName}
              </Tag>
            </div>
            <Typography.Text type="secondary" className="text-xs">
              {existingResume.text.length} characters extracted
            </Typography.Text>
          </Space>
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex items-center space-x-2 my-2">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          <span className="text-blue-600">
            Parsing resume and extracting information...
          </span>
        </div>
      ) : (
        <Upload
          beforeUpload={beforeUpload}
          fileList={fileList}
          onRemove={() => setFileList([])}
          disabled={isLoading}
        >
          <Button icon={<UploadOutlined />} disabled={isLoading}>
            {existingResume?.fileName ? "Replace Resume" : "Select Resume"}
          </Button>
        </Upload>
      )}
    </div>
  );
};

export default ResumeUploader;
