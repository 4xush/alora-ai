import React, { useMemo, useState } from 'react';
import { Table, Input, Tag, Drawer, Descriptions, Typography } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { setSearch, setSort } from '../store/interviewerSlice.js';

const InterviewerPage = () => {
  const dispatch = useDispatch();
  const { candidates, search, sortKey, sortOrder } = useSelector((s) => s.interviewer);
  const [selected, setSelected] = useState(null);

  const data = useMemo(() => {
    const filtered = candidates.filter(
      (c) => c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())
    );
    const sorted = [...filtered].sort((a, b) => {
      const dir = sortOrder === 'ascend' ? 1 : -1;
      if (sortKey === 'score') return dir * ((a.score || 0) - (b.score || 0));
      return dir * String(a[sortKey] || '').localeCompare(String(b[sortKey] || ''));
    });
    return sorted;
  }, [candidates, search, sortKey, sortOrder]);

  const columns = [
    { title: 'Name', dataIndex: 'name', sorter: true },
    { title: 'Email', dataIndex: 'email', sorter: true },
    {
      title: 'Score',
      dataIndex: 'score',
      sorter: true,
      render: (s) => (s !== null && s !== undefined ? <Tag color={s >= 70 ? 'green' : s >= 40 ? 'orange' : 'red'}>{s}</Tag> : '-')
    },
    { title: 'Status', dataIndex: 'status' },
  ];

  return (
    <div>
      <Input.Search
        placeholder="Search by name or email"
        value={search}
        onChange={(e) => dispatch(setSearch(e.target.value))}
        style={{ marginBottom: 16, maxWidth: 360 }}
      />
      <Table
        rowKey={(r) => r.id}
        columns={columns}
        dataSource={data}
        onChange={(pagination, filters, sorter) => {
          if (sorter?.field) dispatch(setSort({ key: sorter.field, order: sorter.order }));
        }}
        onRow={(r) => ({ onClick: () => setSelected(r) })}
      />

      <Drawer open={!!selected} onClose={() => setSelected(null)} width={720} title="Candidate Details">
        {selected && (
          <>
            <Descriptions bordered size="small" column={1} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Name">{selected.name}</Descriptions.Item>
              <Descriptions.Item label="Email">{selected.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{selected.phone}</Descriptions.Item>
              <Descriptions.Item label="Score">{selected.score}</Descriptions.Item>
            </Descriptions>
            <Typography.Title level={5}>Resume Preview</Typography.Title>
            <div style={{ whiteSpace: 'pre-wrap', background: '#fafafa', padding: 8, border: '1px solid #f0f0f0', marginBottom: 16, maxHeight: 200, overflow: 'auto' }}>
              {selected.resumeText}
            </div>
            <Typography.Title level={5}>Interview Transcript</Typography.Title>
            <div style={{ maxHeight: 320, overflow: 'auto' }}>
              {selected.transcript?.map((t, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <Typography.Text strong>Q{i + 1}: {t.q}</Typography.Text>
                  <div>A: {t.a || '-'}</div>
                  <div>Score: {t.score ?? '-'} | {t.explanation}</div>
                </div>
              ))}
            </div>
            <Typography.Title level={5} style={{ marginTop: 16 }}>Final Summary</Typography.Title>
            <div>{selected.summary}</div>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default InterviewerPage;
