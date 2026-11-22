package com.hmis.service.impl;

import com.hmis.entity.Appointment;
import com.hmis.repository.AppointmentRepository;
import com.hmis.service.AppointmentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;

    public AppointmentServiceImpl(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    @Override
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    @Override
    @Transactional
    public Appointment scheduleAppointment(Appointment appointment) {
        List<Appointment> existing = appointmentRepository
                .findByDoctorIdAndAppointmentDate(appointment.getDoctorId(), appointment.getAppointmentDate());

        boolean slotConflict = existing.stream()
                .anyMatch(a -> a.getTimeSlot().equals(appointment.getTimeSlot())
                        && !"Cancelled".equalsIgnoreCase(a.getStatus()));

        if (slotConflict) {
            throw new IllegalStateException("Selected doctor already has an appointment for this time slot.");
        }

        long seq = 2001 + appointmentRepository.count();
        appointment.setAppointmentNo("APT-" + seq);
        return appointmentRepository.save(appointment);
    }

    @Override
    @Transactional
    public Appointment updateAppointmentStatus(Long id, String status) {
        Appointment existing = appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found with id: " + id));
        existing.setStatus(status);
        return appointmentRepository.save(existing);
    }
}
