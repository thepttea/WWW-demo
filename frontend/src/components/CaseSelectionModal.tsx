import React, { useState } from 'react';
import { Modal, Typography, Button } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { HistoricalCase } from '../types';
import './CaseSelectionModal.css';

const { Title, Text } = Typography;

interface CaseSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onCaseSelect: (caseItem: HistoricalCase) => void;
}

const CaseSelectionModal: React.FC<CaseSelectionModalProps> = ({
  visible,
  onClose,
  onCaseSelect,
}) => {
  const [selectedCase, setSelectedCase] = useState<HistoricalCase | null>(null);

  // 模拟案例数据 - 等待后端对接
  const caseStudies: HistoricalCase[] = [
    {
      id: '1',
      title: 'Tech Product Controversy',
      description: 'A tech company faces backlash over a controversial product feature. The PR team must address user concerns and restore trust.',
      originalStrategy: 'Immediate acknowledgment, technical fix, leadership communication, community engagement',
      actualOutcome: 'Successfully restored user trust and improved product development process',
      successRate: 85
    },
    {
      id: '2',
      title: 'Food Safety Crisis',
      description: 'A food brand encounters a health scare related to one of its products. The PR response focuses on transparency and consumer safety.',
      originalStrategy: 'Transparency, safety measures, consumer communication, regulatory compliance',
      actualOutcome: 'Maintained brand reputation and strengthened safety protocols',
      successRate: 90
    },
    {
      id: '3',
      title: 'Fashion Brand Ethics',
      description: 'A fashion retailer is accused of unethical labor practices. The PR strategy involves addressing the allegations and promoting ethical sourcing.',
      originalStrategy: 'Ethical sourcing commitment, third-party audits, supply chain transparency',
      actualOutcome: 'Improved brand image and established industry leadership in ethical practices',
      successRate: 75
    },
    {
      id: '4',
      title: 'Airline Service Disruption',
      description: 'An airline experiences a major service disruption. The PR team must manage passenger frustration and provide timely updates.',
      originalStrategy: 'Real-time communication, compensation, operational improvements, customer service',
      actualOutcome: 'Minimized customer complaints and improved operational resilience',
      successRate: 80
    },
    {
      id: '5',
      title: 'Financial Data Breach',
      description: 'A financial institution faces a data breach. The PR response prioritizes data security and customer communication.',
      originalStrategy: 'Immediate notification, security measures, customer support, regulatory reporting',
      actualOutcome: 'Maintained customer trust and strengthened security infrastructure',
      successRate: 70
    },
    {
      id: '6',
      title: 'Corporate Misconduct Scandal',
      description: 'A high-profile executive is involved in a scandal, damaging the company\'s reputation. The PR team works on damage control and internal reforms.',
      originalStrategy: 'Leadership change, internal reforms, transparency, stakeholder communication',
      actualOutcome: 'Restored stakeholder confidence and implemented stronger governance',
      successRate: 65
    }
  ];

  const handleCaseClick = (caseItem: HistoricalCase) => {
    setSelectedCase(caseItem);
  };

  const handleConfirm = () => {
    if (selectedCase) {
      onCaseSelect(selectedCase);
      onClose();
    }
  };


  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      width="98vw"
      style={{ maxWidth: '1400px' }}
      className="case-selection-modal"
      maskClosable={false}
      destroyOnClose
    >
      <div className="modal-content">
        <div className="modal-header">
          <Title level={2} className="modal-title">Select PR Case Study</Title>
        </div>

        <div className="modal-body">
          <div className="case-list-section">
            <div className="case-list">
              {caseStudies.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className={`case-item ${selectedCase?.id === caseItem.id ? 'selected' : ''}`}
                  onClick={() => handleCaseClick(caseItem)}
                >
                  <div className="case-header">
                    <Title level={4} className="case-title">{caseItem.title}</Title>
                    {selectedCase?.id === caseItem.id && (
                      <CheckOutlined className="check-icon" />
                    )}
                  </div>
                  <Text className="case-description">{caseItem.description}</Text>
                </div>
              ))}
            </div>
          </div>

          <div className="case-details-section">
            <div className="details-header">
              <Title level={3} className="details-title">Detailed PR Strategy Description</Title>
            </div>
            <div className="details-content">
              {selectedCase ? (
                <div className="strategy-details">
                  <div className="strategy-section">
                    <Title level={5} className="strategy-round">Round 1: Initial Response & Transparency</Title>
                    <Text className="strategy-text">
                      Immediately issue a public statement acknowledging the issue. Use all major social media channels and a dedicated page on the corporate website. The message must be empathetic, transparent about what is known, and commit to a full investigation.
                    </Text>
                  </div>
                  <div className="strategy-section">
                    <Title level={5} className="strategy-round">Round 2: Technical Fix & User Compensation</Title>
                    <Text className="strategy-text">
                      Announce a timeline for resolving the issue and offer appropriate compensation to affected stakeholders. This demonstrates tangible commitment to resolving the problem.
                    </Text>
                  </div>
                  <div className="strategy-section">
                    <Title level={5} className="strategy-round">Round 3: Leadership Communication & Future Prevention</Title>
                    <Text className="strategy-text">
                      Leadership should publish a detailed explanation of the missteps and outline new internal processes to prevent similar issues. This rebuilds trust and shows long-term commitment.
                    </Text>
                  </div>
                  <div className="strategy-section">
                    <Title level={5} className="strategy-round">Round 4: Community Engagement & Feedback Loop</Title>
                    <Text className="strategy-text">
                      Create ongoing engagement programs with stakeholders. Host meetings to gather feedback and answer questions directly, fostering community and showing that feedback is integral to the process.
                    </Text>
                  </div>
                </div>
              ) : (
                <div className="empty-details">
                  <Text className="empty-text">Select a case study to view detailed strategy</Text>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <Button
            type="primary"
            size="large"
            onClick={handleConfirm}
            disabled={!selectedCase}
            className="confirm-button"
          >
            Confirm & Return
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CaseSelectionModal;
