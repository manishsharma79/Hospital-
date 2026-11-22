package com.hmis.service;

import com.hmis.entity.Appointment;
import java.util.List;

public interface AppointmentService {
    List<Appointment> getAllAppointments();
    Appointment scheduleAppointment(Appointment appointment);
    Appointment updateAppointmentStatus(Long id, String status);
}
