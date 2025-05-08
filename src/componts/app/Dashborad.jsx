
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Col, Row, Statistic } from 'antd';  // Ant Design components for stats display
import { toast } from 'react-toastify';
import moment from 'moment';

function Dashboard() {
  const [customers, setCustomers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const customerResponse = await axios.get('/coustmer?page=1&limit=1000');
        const logResponse = await axios.get('/logs?page=1&limit=1000');
        
        setCustomers(customerResponse.data.coustmers);
        setLogs(logResponse.data.logs);
      } catch (error) {
        toast.error("Error fetching data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Summary Stats Calculation
  const totalCustomers = customers.length;
  const totalLogs = logs.length;
  const pendingLogs = logs.filter(log => log.status === 'waiting').length;
  const completedLogs = logs.filter(log => log.status === 'completed').length;

  const activeCustomers = customers.filter(customer => 
    logs.some(log => log.customer?._id === customer._id && log.status !== 'completed')
  ).length;

  return (
    <div className="dashboard">
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Total Customers" value={totalCustomers} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Total Logs" value={totalLogs} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Pending Logs" value={pendingLogs} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Completed Logs" value={completedLogs} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="Active Customers" value={activeCustomers} />
          </Card>
        </Col>
      </Row>

      {/* Other dashboard content can go here */}
    </div>
  );
}

export default Dashboard;
