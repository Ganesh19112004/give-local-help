import emailjs from '@emailjs/browser';

// EmailJS Configuration
const EMAILJS_PUBLIC_KEY = 'XwEpXM1Fv28ICGc02';
const EMAILJS_TEMPLATE_ID = 'template_yd3ug8c';
const EMAILJS_SERVICE_ID = 'default_service'; // Update with your service ID

export const initEmailJS = () => {
  emailjs.init(EMAILJS_PUBLIC_KEY);
};

interface EmailParams {
  to_email: string;
  to_name: string;
  subject: string;
  message: string;
  [key: string]: unknown;
}

export const sendEmail = async (params: EmailParams) => {
  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      params
    );
    console.log('Email sent successfully:', response);
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error };
  }
};

export const sendNGOApprovalEmail = async (ngoEmail: string, ngoName: string) => {
  return sendEmail({
    to_email: ngoEmail,
    to_name: ngoName,
    subject: 'NGO Registration Approved - DonateConnect',
    message: `Congratulations! Your NGO "${ngoName}" has been approved. You can now log in and start accepting donations.`
  });
};

export const sendDonationAcceptedEmail = async (donorEmail: string, donorName: string, ngoName: string) => {
  return sendEmail({
    to_email: donorEmail,
    to_name: donorName,
    subject: 'Donation Accepted - DonateConnect',
    message: `Good news! ${ngoName} has accepted your donation. A volunteer will be assigned soon for pickup.`
  });
};

export const sendVolunteerAssignedEmail = async (donorEmail: string, donorName: string, volunteerName: string) => {
  return sendEmail({
    to_email: donorEmail,
    to_name: donorName,
    subject: 'Volunteer Assigned - DonateConnect',
    message: `${volunteerName} has been assigned to pick up your donation. They will contact you shortly.`
  });
};
