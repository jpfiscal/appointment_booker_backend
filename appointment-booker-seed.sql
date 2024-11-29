INSERT INTO accounts (name, password, email, phone, type)
VALUES ('Mandy C',
    '$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
    'info@marveleyes.ca',
    '(123) 456- 7890',
    'provider');

INSERT INTO providers (account_id, specialty, provider_desc)
VALUES (
    1,
    'Mega Volume',
    'Lash specialist for over 5 years and competed in a dozen international competitions.'
);

INSERT INTO services (
    service_name, 
    service_group, 
    service_desc, 
    service_price, 
    service_duration)
VALUES
    (
        'Lip Blush',
        'Lips Bar',
        'Lip blushing is a semi-permanent tattoo that can enhance the colour and shape of your lips and give the impression of more fullness. This is done by depositing colour ink into your lips and along your lip line to improve the overall look. The colour is subtle to give natural-looking results. Your lips will look darker and more like lipstick on the first day, and soften as they heal to become a subtle, natural looking lip tint. Apply a little gloss or balm and your lips are perfectly kissable!',
        400.00,
        3
    ),
    (
        'Nano Brows',
        'Brow Bar',
        'Nano brows are created using a device/tattoo machine and a single needle to mimic the look of realistic hair strokes by implanting pigment beneath the skin. This technique can help to add density to existing set of eyebrows hair or create a completely natural-looking set of eyebrows for those who experience partial or complete hair loss. texture is fully tailored to each individual client for the most realistic results.',
        700.00,
        3
    ),
    (
        'Hybrid Brows',
        'Brow Bar',
        'Hybrid brows are a combination of the Nano and the classic Umbre techniques which delivers the best of both worlds! Nano technique is used on the inside edge of the brows to mimic individual hair strands where the brands are natually more sparse. As the brows extend out to the tail, the umbre technique is used to give the brows their signature fullness.',
        600.00,
        3
    ),
    (
        'Mega Volume - New Set',
        'Lash Bar',
        'Mega Volume lashes are very similar to the traditional Russian volume lashes. This sets uses 0.03 diameter lash extensions, which are the lightest and softest fibres available to create a fan with up to 18D. This style will be sure to provide the maximum glam!',
        210.00,
        4
    );

INSERT INTO availabilities(
    provider_id,
    date,
    start_time,
    end_time
)
VALUES
    (1, '2024-11-28', '09:00:00','10:00:00'),
    (1, '2024-11-28', '10:00:00','11:00:00'),
    (1, '2024-11-28', '11:00:00','12:00:00'),
    (1, '2024-12-02', '09:00:00','10:00:00'),
    (1, '2024-12-02', '10:00:00','11:00:00'),
    (1, '2024-12-02', '11:00:00','12:00:00'),
    (1, '2024-12-02', '13:00:00','14:00:00'),
    (1, '2024-12-02', '14:00:00','15:00:00'),
    (1, '2024-12-02', '15:00:00','16:00:00'),
    (1, '2024-12-02', '16:00:00','17:00:00'),
    (1, '2024-12-02', '17:00:00','18:00:00'),
    (1, '2024-12-02', '18:00:00','19:00:00'),
    (1, '2024-12-02', '19:00:00','20:00:00'),
    (1, '2024-12-02', '20:00:00','21:00:00'),
    (1, '2024-12-03', '09:00:00','10:00:00'),
    (1, '2024-12-03', '10:00:00','11:00:00'),
    (1, '2024-12-03', '11:00:00','12:00:00'),
    (1, '2024-12-03', '13:00:00','14:00:00'),
    (1, '2024-12-03', '14:00:00','15:00:00'),
    (1, '2024-12-03', '15:00:00','16:00:00'),
    (1, '2024-12-03', '16:00:00','17:00:00'),
    (1, '2024-12-03', '17:00:00','18:00:00'),
    (1, '2024-12-03', '18:00:00','19:00:00'),
    (1, '2024-12-03', '19:00:00','20:00:00'),
    (1, '2024-12-03', '20:00:00','21:00:00'),
    (1, '2024-12-04', '09:00:00','10:00:00'),
    (1, '2024-12-04', '10:00:00','11:00:00'),
    (1, '2024-12-04', '11:00:00','12:00:00'),
    (1, '2024-12-04', '13:00:00','14:00:00'),
    (1, '2024-12-04', '14:00:00','15:00:00'),
    (1, '2024-12-04', '15:00:00','16:00:00'),
    (1, '2024-12-04', '16:00:00','17:00:00'),
    (1, '2024-12-04', '17:00:00','18:00:00'),
    (1, '2024-12-04', '18:00:00','19:00:00'),
    (1, '2024-12-04', '19:00:00','20:00:00'),
    (1, '2024-12-04', '20:00:00','21:00:00'),
    (1, '2024-12-05', '09:00:00','10:00:00'),
    (1, '2024-12-05', '10:00:00','11:00:00'),
    (1, '2024-12-05', '11:00:00','12:00:00'),
    (1, '2024-12-05', '13:00:00','14:00:00'),
    (1, '2024-12-05', '14:00:00','15:00:00'),
    (1, '2024-12-05', '15:00:00','16:00:00'),
    (1, '2024-12-05', '16:00:00','17:00:00'),
    (1, '2024-12-05', '17:00:00','18:00:00'),
    (1, '2024-12-05', '18:00:00','19:00:00'),
    (1, '2024-12-05', '19:00:00','20:00:00'),
    (1, '2024-12-05', '20:00:00','21:00:00'),
    (1, '2024-12-06', '09:00:00','10:00:00'),
    (1, '2024-12-06', '10:00:00','11:00:00'),
    (1, '2024-12-06', '11:00:00','12:00:00'),
    (1, '2024-12-06', '13:00:00','14:00:00'),
    (1, '2024-12-06', '14:00:00','15:00:00'),
    (1, '2024-12-06', '15:00:00','16:00:00'),
    (1, '2024-12-06', '16:00:00','17:00:00'),
    (1, '2024-12-06', '17:00:00','18:00:00'),
    (1, '2024-12-06', '18:00:00','19:00:00'),
    (1, '2024-12-06', '19:00:00','20:00:00'),
    (1, '2024-12-06', '20:00:00','21:00:00'),

    (1, '2024-12-09', '09:00:00','10:00:00'),
    (1, '2024-12-09', '10:00:00','11:00:00'),
    (1, '2024-12-09', '11:00:00','12:00:00'),
    (1, '2024-12-09', '13:00:00','14:00:00'),
    (1, '2024-12-09', '14:00:00','15:00:00'),
    (1, '2024-12-09', '15:00:00','16:00:00'),
    (1, '2024-12-09', '16:00:00','17:00:00'),
    (1, '2024-12-09', '17:00:00','18:00:00'),
    (1, '2024-12-09', '18:00:00','19:00:00'),
    (1, '2024-12-09', '19:00:00','20:00:00'),
    (1, '2024-12-09', '20:00:00','21:00:00'),
    (1, '2024-12-10', '09:00:00','10:00:00'),
    (1, '2024-12-10', '10:00:00','11:00:00'),
    (1, '2024-12-10', '11:00:00','12:00:00'),
    (1, '2024-12-10', '13:00:00','14:00:00'),
    (1, '2024-12-10', '14:00:00','15:00:00'),
    (1, '2024-12-10', '15:00:00','16:00:00'),
    (1, '2024-12-10', '16:00:00','17:00:00'),
    (1, '2024-12-10', '17:00:00','18:00:00'),
    (1, '2024-12-10', '18:00:00','19:00:00'),
    (1, '2024-12-10', '19:00:00','20:00:00'),
    (1, '2024-12-10', '20:00:00','21:00:00'),
    (1, '2024-12-11', '09:00:00','10:00:00'),
    (1, '2024-12-11', '10:00:00','11:00:00'),
    (1, '2024-12-11', '11:00:00','12:00:00'),
    (1, '2024-12-11', '13:00:00','14:00:00'),
    (1, '2024-12-11', '14:00:00','15:00:00'),
    (1, '2024-12-11', '15:00:00','16:00:00'),
    (1, '2024-12-11', '16:00:00','17:00:00'),
    (1, '2024-12-11', '17:00:00','18:00:00'),
    (1, '2024-12-11', '18:00:00','19:00:00'),
    (1, '2024-12-11', '19:00:00','20:00:00'),
    (1, '2024-12-11', '20:00:00','21:00:00'),
    (1, '2024-12-12', '09:00:00','10:00:00'),
    (1, '2024-12-12', '10:00:00','11:00:00'),
    (1, '2024-12-12', '11:00:00','12:00:00'),
    (1, '2024-12-12', '13:00:00','14:00:00'),
    (1, '2024-12-12', '14:00:00','15:00:00'),
    (1, '2024-12-12', '15:00:00','16:00:00'),
    (1, '2024-12-12', '16:00:00','17:00:00'),
    (1, '2024-12-12', '17:00:00','18:00:00'),
    (1, '2024-12-12', '18:00:00','19:00:00'),
    (1, '2024-12-12', '19:00:00','20:00:00'),
    (1, '2024-12-12', '20:00:00','21:00:00'),
    (1, '2024-12-13', '09:00:00','10:00:00'),
    (1, '2024-12-13', '10:00:00','11:00:00'),
    (1, '2024-12-13', '11:00:00','12:00:00'),
    (1, '2024-12-13', '13:00:00','14:00:00'),
    (1, '2024-12-13', '14:00:00','15:00:00'),
    (1, '2024-12-13', '15:00:00','16:00:00'),
    (1, '2024-12-13', '16:00:00','17:00:00'),
    (1, '2024-12-13', '17:00:00','18:00:00'),
    (1, '2024-12-13', '18:00:00','19:00:00'),
    (1, '2024-12-13', '19:00:00','20:00:00'),
    (1, '2024-12-13', '20:00:00','21:00:00'),

    (1, '2024-12-16', '09:00:00','10:00:00'),
    (1, '2024-12-16', '10:00:00','11:00:00'),
    (1, '2024-12-16', '11:00:00','12:00:00'),
    (1, '2024-12-16', '13:00:00','14:00:00'),
    (1, '2024-12-16', '14:00:00','15:00:00'),
    (1, '2024-12-16', '15:00:00','16:00:00'),
    (1, '2024-12-16', '16:00:00','17:00:00'),
    (1, '2024-12-16', '17:00:00','18:00:00'),
    (1, '2024-12-16', '18:00:00','19:00:00'),
    (1, '2024-12-16', '19:00:00','20:00:00'),
    (1, '2024-12-16', '20:00:00','21:00:00'),
    (1, '2024-12-17', '09:00:00','10:00:00'),
    (1, '2024-12-17', '10:00:00','11:00:00'),
    (1, '2024-12-17', '11:00:00','12:00:00'),
    (1, '2024-12-17', '13:00:00','14:00:00'),
    (1, '2024-12-17', '14:00:00','15:00:00'),
    (1, '2024-12-17', '15:00:00','16:00:00'),
    (1, '2024-12-17', '16:00:00','17:00:00'),
    (1, '2024-12-17', '17:00:00','18:00:00'),
    (1, '2024-12-17', '18:00:00','19:00:00'),
    (1, '2024-12-17', '19:00:00','20:00:00'),
    (1, '2024-12-17', '20:00:00','21:00:00'),
    (1, '2024-12-18', '09:00:00','10:00:00'),
    (1, '2024-12-18', '10:00:00','11:00:00'),
    (1, '2024-12-18', '11:00:00','12:00:00'),
    (1, '2024-12-18', '13:00:00','14:00:00'),
    (1, '2024-12-18', '14:00:00','15:00:00'),
    (1, '2024-12-18', '15:00:00','16:00:00'),
    (1, '2024-12-18', '16:00:00','17:00:00'),
    (1, '2024-12-18', '17:00:00','18:00:00'),
    (1, '2024-12-18', '18:00:00','19:00:00'),
    (1, '2024-12-18', '19:00:00','20:00:00'),
    (1, '2024-12-18', '20:00:00','21:00:00'),
    (1, '2024-12-19', '09:00:00','10:00:00'),
    (1, '2024-12-19', '10:00:00','11:00:00'),
    (1, '2024-12-19', '11:00:00','12:00:00'),
    (1, '2024-12-19', '13:00:00','14:00:00'),
    (1, '2024-12-19', '14:00:00','15:00:00'),
    (1, '2024-12-19', '15:00:00','16:00:00'),
    (1, '2024-12-19', '16:00:00','17:00:00'),
    (1, '2024-12-19', '17:00:00','18:00:00'),
    (1, '2024-12-19', '18:00:00','19:00:00'),
    (1, '2024-12-19', '19:00:00','20:00:00'),
    (1, '2024-12-19', '20:00:00','21:00:00'),
    (1, '2024-12-20', '09:00:00','10:00:00'),
    (1, '2024-12-20', '10:00:00','11:00:00'),
    (1, '2024-12-20', '11:00:00','12:00:00'),
    (1, '2024-12-20', '13:00:00','14:00:00'),
    (1, '2024-12-20', '14:00:00','15:00:00'),
    (1, '2024-12-20', '15:00:00','16:00:00'),
    (1, '2024-12-20', '16:00:00','17:00:00'),
    (1, '2024-12-20', '17:00:00','18:00:00'),
    (1, '2024-12-20', '18:00:00','19:00:00'),
    (1, '2024-12-20', '19:00:00','20:00:00'),
    (1, '2024-12-20', '20:00:00','21:00:00'),

    (1, '2024-12-23', '09:00:00','10:00:00'),
    (1, '2024-12-23', '10:00:00','11:00:00'),
    (1, '2024-12-23', '11:00:00','12:00:00'),
    (1, '2024-12-23', '13:00:00','14:00:00'),
    (1, '2024-12-23', '14:00:00','15:00:00'),
    (1, '2024-12-23', '15:00:00','16:00:00'),
    (1, '2024-12-23', '16:00:00','17:00:00'),
    (1, '2024-12-23', '17:00:00','18:00:00'),
    (1, '2024-12-23', '18:00:00','19:00:00'),
    (1, '2024-12-23', '19:00:00','20:00:00'),
    (1, '2024-12-23', '20:00:00','21:00:00'),
    (1, '2024-12-24', '09:00:00','10:00:00'),
    (1, '2024-12-24', '10:00:00','11:00:00'),
    (1, '2024-12-24', '11:00:00','12:00:00'),
    (1, '2024-12-24', '13:00:00','14:00:00'),
    (1, '2024-12-24', '14:00:00','15:00:00'),
    (1, '2024-12-24', '15:00:00','16:00:00'),
    (1, '2024-12-27', '09:00:00','10:00:00'),
    (1, '2024-12-27', '10:00:00','11:00:00'),
    (1, '2024-12-27', '11:00:00','12:00:00'),
    (1, '2024-12-27', '13:00:00','14:00:00'),
    (1, '2024-12-27', '14:00:00','15:00:00'),
    (1, '2024-12-27', '15:00:00','16:00:00'),
    (1, '2024-12-27', '16:00:00','17:00:00'),
    (1, '2024-12-27', '17:00:00','18:00:00'),
    (1, '2024-12-27', '18:00:00','19:00:00'),
    (1, '2024-12-27', '19:00:00','20:00:00'),
    (1, '2024-12-27', '20:00:00','21:00:00'),

    (1, '2024-12-30', '09:00:00','10:00:00'),
    (1, '2024-12-30', '10:00:00','11:00:00'),
    (1, '2024-12-30', '11:00:00','12:00:00'),
    (1, '2024-12-30', '13:00:00','14:00:00'),
    (1, '2024-12-30', '14:00:00','15:00:00'),
    (1, '2024-12-30', '15:00:00','16:00:00'),
    (1, '2024-12-30', '16:00:00','17:00:00'),
    (1, '2024-12-30', '17:00:00','18:00:00'),
    (1, '2024-12-30', '18:00:00','19:00:00'),
    (1, '2024-12-30', '19:00:00','20:00:00'),
    (1, '2024-12-30', '20:00:00','21:00:00'),
    (1, '2024-12-31', '09:00:00','10:00:00'),
    (1, '2024-12-31', '10:00:00','11:00:00'),
    (1, '2024-12-31', '11:00:00','12:00:00'),
    (1, '2024-12-31', '13:00:00','14:00:00'),
    (1, '2024-12-31', '14:00:00','15:00:00'),
    (1, '2024-12-31', '15:00:00','16:00:00');