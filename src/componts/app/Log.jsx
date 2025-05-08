
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Skeleton, Table, Button, Modal, Divider, Form, Select, Input, DatePicker, Pagination
} from 'antd';
import {
  DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { toast } from 'react-toastify';

axios.defaults.baseURL = "http://localhost:3000";

function Log() {
  const [open, setOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchKey, setSearchKey] = useState('');
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);

  const [form] = Form.useForm();

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`/logs?page=${page}&limit=${limit}`);
        setLogs(response.data.logs);
        setTotal(response.data.total);
      } catch (error) {
        toast.error("Error fetching logs");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [page, limit]);

  // Keeping the previous spelling for customers' API endpoint
  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('/coustmer?page=1&limit=1000'); // Fetch all customers with your endpoint
        setCustomers(response.data.coustmers); // Assuming this is the data structure returned
      } catch (error) {
        toast.error("Error fetching customers");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/logs/${id}`);
      toast.success("Log deleted");
      const response = await axios.get(`/logs?page=${page}&limit=${limit}`);
      setLogs(response.data.logs);
      setTotal(response.data.total);
    } catch (err) {
      toast.error("Error deleting log");
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingLog?._id) {
        await axios.put(`/logs/${editingLog._id}`, values);
        toast.success("Log updated");
      } else {
        await axios.post('/logs', values);
        toast.success("Log created");
      }

      const response = await axios.get(`/logs?page=${page}&limit=${limit}`);
      setLogs(response.data.logs);
      setTotal(response.data.total);
      setOpen(false);
      form.resetFields();
      setEditingLog(null);
    } catch (error) {
      toast.error("Error saving log");
    }
  };

  const handleEdit = (log) => {
    setEditingLog(log);
    form.setFieldsValue({
      ...log,
      customer: log.customer?._id,
      startAt: log.startAt ? moment(log.startAt) : null,
      endsAt: log.endsAt ? moment(log.endsAt) : null,
      followUp: log.followUp ? moment(log.followUp) : null
    });
    setOpen(true);
  };

  const onPaginate = (p, s) => {
    setPage(p);
    setLimit(s);
  };

  const filteredLogs = logs.filter((log) =>
    [log.status, log.customer?.fullname].some(field =>
      field?.toLowerCase().includes(searchKey)
    )
  );

  const columns = [
    {
      title: "Customer",
      dataIndex: "customer",
      render: (customer) => customer?.fullname || "N/A"
    },
    {
      title: "Status",
      dataIndex: "status",
    },
    {
      title: "Start",
      dataIndex: "startAt",
      render: (val) => val ? moment(val).format("DD MMM YYYY, hh:mm A") : "-"
    },
    {
      title: "End",
      dataIndex: "endsAt",
      render: (val) => val ? moment(val).format("DD MMM YYYY, hh:mm A") : "-"
    },
    {
      title: "Follow Up",
      dataIndex: "followUp",
      render: (val) => val ? moment(val).format("DD MMM YYYY, hh:mm A") : "-"
    },
    {
      title: "Action",
      render: (item) => (
        <div className="space-x-2">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(item)} />
          <Button icon={<DeleteOutlined />} onClick={() => handleDelete(item._id)} danger />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Input
          size="large"
          placeholder="Search status or customer name"
          prefix={<SearchOutlined className="!text-gray-300" />}
          className="!w-[350px]"
          value={searchKey}
          onChange={(e) => setSearchKey(e.target.value.toLowerCase())}
        />
        <Button
          icon={<PlusOutlined />}
          type="primary"
          size="large"
          onClick={() => {
            setOpen(true);
            setEditingLog(null);
          }}
        >
          Add Log
        </Button>
      </div>

      <Divider />

      {isLoading ? (
        <Skeleton active />
      ) : (
        <Table
          columns={columns}
          dataSource={filteredLogs}
          rowKey="_id"
          pagination={false}
        />
      )}

      <div className="flex justify-end mt-2">
        <Pagination
          total={total}
          current={page}
          pageSize={limit}
          onChange={onPaginate}
          hideOnSinglePage
        />
      </div>

      {/* Modal for Add/Edit Log */}
      <Modal
        open={open}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
          setEditingLog(null);
        }}
        footer={null}
      >
        <Divider />
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item name="customer" label="Customer" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="Select a customer"
              loading={isLoading}
              optionFilterProp="children"
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {customers.map((customer) => (
                <Select.Option key={customer._id} value={customer._id}>
                  {customer.fullname}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select
              options={[
                { label: "calling", value: "calling" },
                { label: "busy", value: "busy" },
                { label: "waiting", value: "waiting" },
                { label: "not received", value: "not received" },
                { label: "switch off", value: "switch off" },
                { label: "not reachable", value: "not reachable" },
              ]}
            />
          </Form.Item>

          <Form.Item name="startAt" label="Start Time">
            <DatePicker showTime className="!w-full" />
          </Form.Item>
          <Form.Item name="endsAt" label="End Time">
            <DatePicker showTime className="!w-full" />
          </Form.Item>
          <Form.Item name="followUp" label="Follow Up">
            <DatePicker showTime className="!w-full" />
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit" type="primary">
              {editingLog ? "Update" : "Create"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Log;
