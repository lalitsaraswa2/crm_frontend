
import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import axios from 'axios';
import fatch from '../../lib/Fatch';
import {
  Skeleton, Table, Button, Modal, Divider, Form, Input, Pagination
} from 'antd';
import {
  DeleteOutlined, EditOutlined, ImportOutlined,
  PlusOutlined, SearchOutlined, UploadOutlined, UserAddOutlined, DownloadOutlined
} from '@ant-design/icons';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';
import moment from 'moment';
import { toast } from 'react-toastify';
import * as XLS from 'xlsx';

axios.defaults.baseURL = "http://localhost:3000";

function Customer() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchKey, setSearchKey] = useState('');
  const [importModal, setImportModal] = useState(false);
  const [importedCustomers, setImportedCustomers] = useState([]);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form] = Form.useForm();

  const { data, error, isLoading } = useSWR(`/coustmer?page=${page}&limit=${limit}`, fatch);

  const deleteCustomer = async (id) => {
    try {
      await axios.delete(`/coustmer/${id}`);
      mutate(`/coustmer?page=${page}&limit=${limit}`);
    } catch (err) {
      toast.error("Failed to delete", { position: 'top-center' });
    }
  };

  const handleFormSubmit = async (values) => {
    const cleanedMobile = values.mobile.replace(/\D/g, '').slice(-10);

    if (!/^\d{10}$/.test(cleanedMobile)) {
      return toast.error("Mobile must be exactly 10 digits", { position: 'top-center' });
    }

    try {
      if (editingCustomer) {
        await axios.put(`/coustmer/${editingCustomer._id}`, { ...values, mobile: cleanedMobile });
        toast.success("Customer Updated Successfully", { position: 'top-center' });
      } else {
        const existing = data?.coustmers || [];
        const isDuplicateName = existing.some(c => c.fullname.toLowerCase() === values.fullname.toLowerCase());
        const isDuplicateEmail = existing.some(c => c.email.toLowerCase() === values.email.toLowerCase());

        if (isDuplicateName) return toast.error("This name already exists", { position: 'top-center' });
        if (isDuplicateEmail) return toast.error("This email already exists", { position: 'top-center' });

        await axios.post('/coustmer', { ...values, mobile: cleanedMobile });
        toast.success("Customer Created Successfully", { position: 'top-center' });
      }

      setOpen(false);
      form.resetFields();
      setEditingCustomer(null);
      mutate(`/coustmer?page=${page}&limit=${limit}`);
    } catch (error) {
      toast.error(error.message, { position: 'top-center' });
    }
  };

  const onPaginate = (pageNo, pageSize) => {
    setPage(pageNo);
    setLimit(pageSize);
  };

  const handleSearchInput = (e) => {
    setSearchKey(e.target.value.toLowerCase());
  };

  const filteredCustomers = data?.coustmers?.filter((item) =>
    [item.fullname, item.email, item.mobile].some(field =>
      field?.toLowerCase().includes(searchKey)
    )
  ) || [];

  const downloadSample = () => {
    const a = document.createElement("a");
    a.href = process.env.PUBLIC_URL + "/SampleXLStype_19kb.xls";
    a.download = "SampleXLStype_19kb.xls";
    a.click();
    a.remove();
  };

  const exportToExcel = () => {
    const exportData = [...filteredCustomers];
    if (exportData.length === 0) {
      return toast.warn("No data to export", { position: "top-center" });
    }

    const worksheet = XLS.utils.json_to_sheet(exportData);
    const workbook = XLS.utils.book_new();
    XLS.utils.book_append_sheet(workbook, worksheet, "Customers");

    XLS.writeFile(workbook, "Customers_Export.xlsx");
  };

  const importXlstype = async (e) => {
    const file = e.target.files[0];

    if (!file || (!file.name.endsWith('.xls') && !file.name.endsWith('.xlsx'))) {
      return toast.error("Invalid file type. Please upload .xls or .xlsx", { position: "top-center" });
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const result = new Uint8Array(event.target.result);
        const workbook = XLS.read(result, { type: "array" });
        const firstSheet = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheet];
        const rawData = XLS.utils.sheet_to_json(sheet, { defval: "" });

        if (rawData.length === 0) {
          return toast.error("Your file is empty", { position: "top-center" });
        }

        const normalizeKey = (key) => key.trim().toLowerCase().replace(/\s+/g, '');

        const customers = rawData.map((item, index) => {
          const normalized = {};
          for (let key in item) {
            normalized[normalizeKey(key)] = item[key];
          }

          return {
            _id: `imported-${index}`,
            fullname: normalized.fullname || '',
            email: normalized.email || '',
            mobile: normalized.mobile || '',
            createdAt: new Date().toISOString()
          };
        });

        setImportedCustomers(customers);
        toast.success(`${customers.length} customers imported successfully`, { position: "top-center" });
        setImportModal(false);
      } catch (err) {
        console.error("Excel Parse Error:", err);
        toast.error("Failed to import. Check format.", { position: "top-center" });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const columns = [
    {
      key: 'fullname',
      title: 'Fullname',
      dataIndex: 'fullname',
    },
    {
      key: 'email',
      title: 'Email',
      dataIndex: 'email',
    },
    {
      key: 'mobile',
      title: 'Mobile',
      dataIndex: 'mobile',
    },
    {
      key: 'created',
      title: 'Created',
      render: (item) => (
        <label>{moment(item.createdAt).format('DD MMM yyyy, hh:mm A')}</label>
      ),
    },
    {
      key: 'action',
      title: 'Action',
      render: (item) => (
        <div className='space-x-3'>
          <Button
            icon={<EditOutlined />}
            className='!text-violet-600 !border-violet-600 !border-2'
            onClick={() => {
              form.setFieldsValue(item);
              setEditingCustomer(item);
              setOpen(true);
            }}
          />
          <Button
            onClick={() => deleteCustomer(item._id)}
            icon={<DeleteOutlined />}
            className='!text-rose-600 !border-rose-600 !border-2'
          />
        </div>
      ),
    }
  ];

  if (isLoading) return <Skeleton active />;
  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <Input
          size='large'
          placeholder='Search customers'
          prefix={<SearchOutlined className='!text-gray-300' />}
          className='!w-[350px]'
          value={searchKey}
          onChange={handleSearchInput}
        />
        <div className='space-x-3'>
          <Button icon={<UploadOutlined />} size='large' onClick={() => setImportModal(true)}>
            Import Customers
          </Button>
          <Button icon={<DownloadOutlined />} size='large' onClick={exportToExcel}>
            Export Customers
          </Button>
          <Button icon={<PlusOutlined />} size='large' type='primary' className='!bg-violet-500'
            onClick={() => {
              form.resetFields();
              setEditingCustomer(null);
              setOpen(true);
            }}>
            Add Customer
          </Button>
        </div>
      </div>
      <Divider />
      <Table
        columns={columns}
        dataSource={[...filteredCustomers, ...importedCustomers]}
        rowKey="_id"
        pagination={false}
      />
      <div className='flex justify-end'>
        <Pagination
          total={data?.total || 0}
          onChange={onPaginate}
          current={page}
          pageSize={limit}
          hideOnSinglePage
        />
      </div>

      {/* Import Modal */}
      <Modal open={importModal} footer={null} onCancel={() => setImportModal(false)} maskClosable={false}>
        <input type="file" accept=".xls, .xlsx" onChange={importXlstype} />
      </Modal>

      {/* Add/Edit Customer Modal */}
      <Modal
        open={open}
        footer={null}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
          setEditingCustomer(null);
        }}
        maskClosable={false}
        title={editingCustomer ? "Edit Customer" : "Add Customer"}
      >
        <Divider />
        <Form layout='vertical' onFinish={handleFormSubmit} form={form}>
          <Form.Item label="Customer's name" name="fullname" rules={[{ required: true }]}>
            <Input size='large' placeholder='Mr Pahlad' />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: "email" }]}>
            <Input size='large' placeholder='mail@mail.com' />
          </Form.Item>
          <Form.Item label="Mobile" name="mobile" rules={[{ required: true }]}>
            <PhoneInput country={'in'} containerClass='!w-full' inputClass='!w-full' />
          </Form.Item>
          <Form.Item>
            <Button icon={<UserAddOutlined />} type='primary' htmlType='submit' size='large'>
              {editingCustomer ? 'Update Customer' : 'Add Now'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Customer;


