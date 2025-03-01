# Generated by Django 4.2.18 on 2025-02-08 22:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='node',
            options={},
        ),
        migrations.RemoveField(
            model_name='node',
            name='destination_nodes',
        ),
        migrations.AddField(
            model_name='node',
            name='routing_probabilities',
            field=models.JSONField(default=list),
        ),
        migrations.AlterField(
            model_name='node',
            name='arrival_rate',
            field=models.FloatField(default=0.0),
        ),
        migrations.AlterField(
            model_name='node',
            name='service_rate',
            field=models.FloatField(default=1.0),
        ),
    ]
