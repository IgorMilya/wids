use std::ffi::c_void;
use std::ptr::{null, null_mut};
use windows::{Win32::Foundation::*, Win32::NetworkManagement::WiFi::*};

pub fn trigger_scan() {
    unsafe {
        let mut client_handle = HANDLE(null_mut());
        let mut negotiated_version: u32 = 0;

        let result = WlanOpenHandle(2, Some(null()), &mut negotiated_version, &mut client_handle);
        if result != ERROR_SUCCESS.0 {
            println!("Failed to open WLAN handle.");
            return;
        }

        let mut iface_list_ptr: *mut WLAN_INTERFACE_INFO_LIST = null_mut();

        let result = WlanEnumInterfaces(client_handle, Some(null()), &mut iface_list_ptr);
        if result != ERROR_SUCCESS.0 {
            println!("Failed to enumerate interfaces.");
            WlanCloseHandle(client_handle, Some(null()));
            return;
        }

        let iface_list = &*iface_list_ptr;
        for i in 0..iface_list.dwNumberOfItems {
            let iface_info = iface_list.InterfaceInfo[i as usize];
            println!(
                "Triggering scan on interface: {:?}",
                iface_info.strInterfaceDescription
            );

            let result = WlanScan(
                client_handle,
                &iface_info.InterfaceGuid,
                None,
                None,
                Some(null()),
            );

            if result != ERROR_SUCCESS.0 {
                println!("WlanScan failed.");
            }
        }

        WlanFreeMemory(iface_list_ptr as *mut c_void);

        WlanCloseHandle(client_handle, Some(null()));
    }
}
